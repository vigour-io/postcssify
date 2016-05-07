'use strict'
const resolve = require('browser-resolve')
const readline = require('readline')
const through = require('through2')
const fs = require('fs')

// @todo finish this import thing bulletproof
const hasimport = /^(\s*?)@import ((url\((['"]?)([^\s]*?)(['"]?)\))|((['"]?)([^\s]*?)(['"]?)))(\s*?);/
const hasrequire = /require(\s*?)\((\s*?)["'](.*?)["'](\s*?)\)/
const comment = /^(\s*?)\/\//
const commentstart = /^(\s*?)\/\*/
const commentend = /^(\s*?)\*\//
const hasurl = /^https:\/\/|^http:\/\//

const paths = {}
const deps = {}
let entry
let last
let time
let laststream

module.exports = function transform (file) {
  if (/\.json/.test(file)) {
    return through()
  } else {
    let commentblock, requires
    if (!entry) { entry = file }
    if (/\.css/.test(file)) {
      let body = ''
      let done
      const stream = through()
      const reader = readline.createInterface({
        input: stream
      }).on('line', (line) => {
        if (!done && relevant(line)) {
          if (!commentblock) {
            if (commentstart.test(line)) {
              commentblock = true
            } else if (hasimport.test(line)) {
              const importfile = imported(line)
              if (!hasurl.test(importfile)) {
                body += `require('` + importfile + `')\n`
                ;(requires || (requires = [])).push(importfile)
              }
            } else {
              collect(requires, file)
              done = true
            }
          } else if (commentend.test(line)) {
            commentblock = false
          }
        }
      })
      return through((buf, enc, next) => {
        if (!done) { stream.push(buf) }
        next()
      }, function (flush) {
        this.push(body)
        reader.close()
        flush()
      })
    } else {
      readline.createInterface({
        input: fs.createReadStream(file)
      }).on('line', (line) => {
        if (relevant(line)) {
          if (!commentblock) {
            if (commentstart.test(line)) {
              commentblock = true
            } else if (hasrequire.test(line)) {
              ;(requires || (requires = [])).push(required(line))
            }
          } else if (commentend.test(line)) {
            commentblock = false
          }
        }
      }).on('close', () => collect(requires, file))
      return through()
    }
  }
}

setTimeout(function () {
  const ordered = order(deps[entry], [], {})
  const l = ordered.length
  for (let i = 0; i < l; i++) {
    console.log('- ', ordered[i])
  }
  console.log(JSON.stringify(paths, false, 2))
}, 5000)

function collect (files, file) {
  if (files) {
    const l = files.length
    let cnt = l
    file = realpath(file)
    if (!deps[file]) {
      deps[file] = {}
    }
    for (let i = 0; i < l; i++) {
      const index = i
      resolve(files[i], { filename: file }, (err, result) => {
        if (err) { throw err }
        files[index] = result
        if (!--cnt) {
          for (let i = 0; i < l; i++) {
            let resolved = realpath(files[i])
            deps[file][resolved] = deps[resolved] || (deps[resolved] = {})
          }
        }
      })
    }
  }
}

function realpath (file) {
  if (!paths[file]) {
    paths[file] = fs.realpathSync(file)
  }
  return paths[file]
}

function order (d, arr, visited) {
  for (let i in d) {
    if (!visited[i]) {
      let obj = d[i]
      visited[i] = true
      arr = arr.concat(order(obj, [], visited))
      if (/\.css/.test(i)) {
        arr.push(i)
      }
    }
  }
  return arr
}

function imported (line) {
  let file = hasimport.exec(line)[9]
  return file
}

function required (line) {
  return hasrequire.exec(line)[3]
}

function relevant (line) {
  return line && !comment.test(line)
}
