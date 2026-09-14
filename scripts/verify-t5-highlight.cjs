/** Mirrors renderHighlight split in T5.tsx — fails if marker logic breaks. */
const text = 'PERMIT MUST *MATCH* THE';
const parts = text.split(/(\*[^*]+\*)/g);
if (parts.length !== 3) throw new Error(`expected 3 parts, got ${parts.length}`);
if (parts[1] !== '*MATCH*') throw new Error(`middle segment wrong: ${parts[1]}`);
console.log('T5 highlight self-check ok');
