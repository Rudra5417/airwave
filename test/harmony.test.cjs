// Guards the harmony engine in index.html.
//
// These functions are extracted from the shipped file rather than duplicated, so
// the test cannot pass while the instrument is broken. No browser, no build step —
// just `node test/harmony.test.cjs`.
//
// Run: node test/harmony.test.cjs
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(FILE, 'utf8');

const script = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!script) throw new Error('no <script type="module"> found in index.html');
const js = script[1];

const pick = re => {
  const m = js.match(re);
  if (!m) throw new Error('not found in index.html: ' + re);
  return m[0];
};

const source = [
  pick(/const NOTE_NAMES = \[[^\]]*\];/),
  pick(/const SCALES = \{[\s\S]*?\n\};/),
  pick(/const PROGRESSIONS = \{[\s\S]*?\n\};/),
  pick(/const clamp = [^\n]+/),
  pick(/function triadAt\([\s\S]*?\n\}/),
  pick(/function chordName\([\s\S]*?\n\}/),
  pick(/function buildChord\([\s\S]*?\n\}/),
].join('\n');

const CFG = { baseMidi: +js.match(/baseMidi:\s*(\d+)/)[1] };
const M = new Function('CFG',
  source + '; return { SCALES, PROGRESSIONS, buildChord, NOTE_NAMES };')(CFG);

let fails = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
  if (!ok) fails++;
};

const pc = m => ((m % 12) + 12) % 12;
const degreesOf = k => M.PROGRESSIONS[k].degrees.length;
const namesIn = (scale, prog) =>
  Array.from({ length: degreesOf(prog) }, (_, i) => M.buildChord(scale, prog, i).name).join(' ');

console.log('\n=== the canonical progressions, in A minor ===');
for (const [prog, want] of Object.entries({
  levels:    'Am C G F',      // Avicii, "Levels"
  anthem:    'Am Em F Dm',    // I-V-vi-IV
  deep:      'Am F Dm',       // i-VI-iv
  trance:    'Am G F G',      // i-VII-VI-VII
  dark:      'Am Am F G',     // i-i-VI-VII
  future:    'Am C F Dm',     // I-iii-vi-IV
  emotional: 'F Dm Am Em',    // vi-IV-I-V
  andalusian:'Am G F Em',     // i-VII-VI-V
})){
  const got = namesIn('minor', prog);
  check(`${prog.padEnd(10)} ${want}`, got === want, got === want ? '' : `got: ${got}`);
}

console.log('\n=== every scale is seven notes (progressions are diatonic) ===');
for (const [k, s] of Object.entries(M.SCALES)){
  check(`${k.padEnd(9)} ${s.steps.length} notes`, s.steps.length === 7, s.steps.join(','));
}

console.log('\n=== every chord is diatonic to its scale ===');
{
  const bad = [];
  for (const sk of Object.keys(M.SCALES)){
    const inScale = new Set(M.SCALES[sk].steps.map(s => pc(CFG.baseMidi + s)));
    for (const pk of Object.keys(M.PROGRESSIONS)){
      for (let i = 0; i < degreesOf(pk); i++){
        const c = M.buildChord(sk, pk, i);
        if (!c.tones.every(t => inScale.has(pc(t)))) bad.push(`${pk}/${sk}#${i} ${c.name}`);
      }
    }
  }
  check('all scale x progression combos', bad.length === 0, bad.slice(0, 6).join('  '));
}

console.log('\n=== chord names match the intervals that sound ===');
{
  const bad = [];
  for (const sk of Object.keys(M.SCALES)){
    for (const pk of Object.keys(M.PROGRESSIONS)){
      for (let i = 0; i < degreesOf(pk); i++){
        const c = M.buildChord(sk, pk, i);
        const third = pc(c.tones[1] - c.tones[0]);
        const fifth = pc(c.tones[2] - c.tones[0]);
        const want = third === 3 ? (fifth === 6 ? 'dim' : 'm')
                   : third === 4 ? (fifth === 8 ? 'aug' : '')
                   : '?';
        const got = c.name.slice(M.NOTE_NAMES[pc(c.tones[0])].length);
        if (got !== want || got === '?') bad.push(`${c.name} want '${want}' got '${got}'`);
      }
    }
  }
  check('no unnameable or mislabelled chord', bad.length === 0, [...new Set(bad)].slice(0, 6).join('  '));
}

console.log('\n=== a bare letter never means minor ===');
{
  const bad = [];
  for (const sk of Object.keys(M.SCALES))
    for (const pk of Object.keys(M.PROGRESSIONS))
      for (let i = 0; i < degreesOf(pk); i++){
        const c = M.buildChord(sk, pk, i);
        if (pc(c.tones[1] - c.tones[0]) === 3 && !/m|dim/.test(c.name)) bad.push(c.name);
      }
  check('minor chords are marked', bad.length === 0, [...new Set(bad)].join(' '));
}

console.log(`\n${fails === 0 ? 'ALL HARMONY CHECKS PASSED' : fails + ' CHECK(S) FAILED'}`);
process.exit(fails === 0 ? 0 : 1);
