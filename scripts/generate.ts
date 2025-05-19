import fs from 'node:fs'

// Current using a fork of cpupro, that I read it from the filesystem
// https://github.com/antfu/cpupro/tree/feat/link-editor
const file = fs.readFileSync(
  // './node_modules/cpupro/build/report.html',
  '../cpupro/build/report.html',
  'utf-8',
)

fs.mkdirSync('./src/html', { recursive: true })
fs.writeFileSync(
  './src/html/report.ts',
  [
    `export const report = ${JSON.stringify(file)}`,
    '',
  ].join('\n'),
  'utf-8',
)
