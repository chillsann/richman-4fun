import fs from 'fs';
import path from 'path';

const dir = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'));
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

const shell = read('src/shell.html');
const css = read('src/style.css');
const js = ['src/data.js', 'src/core.js', 'src/ui.js'].map(read).join('\n\n');

const html = shell
  .replace('<!--CSS-->', () => css)
  .replace('<!--JS-->', () => js);

fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
console.log('built index.html:', (html.length / 1024).toFixed(1) + ' KB');
