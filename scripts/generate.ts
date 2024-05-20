import fs from 'node:fs'

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
