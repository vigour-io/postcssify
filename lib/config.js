'use strict'
const args = process.argv
const l = args.length
let dest
for (let i = 0; i < l; i++) {
  let arg = args[i]
  if (arg === '--css') {
    dest = args[i + 1]
    break
  } else if (arg === '-o' || arg === '--outfile') {
    dest = args[i + 1].split('.')
    dest[dest.length - 1] = 'css'
    dest = dest.join('.')
    break
  }
}
exports.ignoremark = '// postcssify-ignore-file'
exports.dest = dest
