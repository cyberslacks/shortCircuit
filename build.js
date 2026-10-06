const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css', 'component-parts.css', 'circuit.js']) {
  fs.copyFileSync(path.join(__dirname, file), path.join(out, file));
}
console.log('Static site built in dist/');
