'use strict'
const isBuiltinModule = require('is-builtin-module')
const resolve = require('browser-resolve')
const log = require('bole')('postcssify')
const readline = require('readline')
const through = require('through2')
const postcss = require('postcss')
const stream = require('stream')
const fs = require('fs')
const processor = postcss([
  require('postcss-cssnext'),
  require('postcss-calc'),
  // require('postcss-url')
])

// config
const config = require('./config')
const ignoremark = config.ignoremark

// tests
const test = require('./test')
const commentstart = test.commentstart
const commentend = test.commentend
const hasrequire = test.hasrequire
const hasimport = test.hasimport
const relevant = test.relevant
const required = test.required
const isparsed = test.isparsed
const imported = test.imported
const hasurl = test.hasurl
const json = test.json
const css = test.css

// store
const postcssify = require('./store')
const styles = postcssify.styles
const paths = postcssify.paths
const deps = postcssify.deps
const dest = postcssify.dest

// transform
module.exports = function transform (file, b) {
  if (!json(file) && init(file)) {
    return css(file) ? csstransform(file) : jstransform(file)
  } else {
    return through()
  }
}

// init => returns false if no dest is defined
function init (file) {
  if (!postcssify.entry) {
    if (postcssify.dest) {
      log.info('output: %s', postcssify.dest)
      process.on('beforeExit', () => {
        if (!postcssify.complete) {
          postcssify.complete = true
          bundle()
        }
      })
      postcssify.entry = file
    } else {
      return
    }
  }
  return true
}

// js transform
function jstransform (file) {
  let commentblock, requires
  const stream = through()
  readline.createInterface({
    input: stream
  }).on('line', (line) => {
    if (relevant(line)) {
      if (!commentblock) {
        if (commentstart(line)) {
          commentblock = true
        } else if (hasrequire(line)) {
          const req = required(line)
          if (!isBuiltinModule(req)) {
            (requires || (requires = [])).push(req)
          }
        }
      } else if (commentend(line)) {
        commentblock = false
      }
    }
  }).on('close', () => collect(requires, file))
  return stream
}

// css transform
function csstransform (file) {
  let commentblock, imports, collected, secondpass
  let jsbody = ignoremark
  let cssbody = ''
  const readable = readstream()
  const reader = readline.createInterface({
    input: readable
  }).on('line', (line) => {
    if (!collected && relevant(line)) {
      if (!commentblock) {
        if (commentstart(line)) {
          if (!commentend(line)) {
            commentblock = true
          }
        } else if (hasimport(line)) {
          const importfile = imported(line)
          if (!hasurl(importfile)) {
            jsbody += `\nrequire('` + importfile + `')`
            ;(imports || (imports = [])).push(importfile)
            return
          }
        } else {
          collect(imports, file, true)
          collected = true
        }
      } else if (commentend(line)) {
        commentblock = false
      }
    }
    cssbody += line + '\n'
  })
  return through(function (buf, enc, next) {
    if (secondpass || (secondpass = isparsed(buf))) {
      this.push(buf)
    } else {
      readable.push(buf)
    }
    next()
  }, function (flush) {
    if (secondpass) {
      flush()
    } else {
      reader.on('close', () => {
        const from = realpath(file)
        styles[from] = postcss.parse(cssbody, { from: from })
        // styles[realpath(file)] = cssbody
        if (!collected) {
          collect(imports, file, true)
        }
        this.push(jsbody)
        flush()
      })
      readable.push(null)
    }
  })
}

// collect requires/imports
function collect (files, file, rebundle) {
  if (files) {
    const l = files.length
    let cnt = l
    file = realpath(file)
    preparedep(file)
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
          debouncebundle(100)
        }
      })
    }
  } else if (rebundle) {
    debouncebundle(100)
  }
}

// create or clear dep object
function preparedep (file) {
  if (!deps[file]) {
    deps[file] = {}
  } else {
    for (let i in deps[file]) {
      delete deps[file][i]
    }
  }
}

// throttled bundle
function debouncebundle (time) {
  let timer = postcssify.timer
  if (timer) { clearTimeout(timer) }
  postcssify.timer = setTimeout(() => {
    postcssify.timer = null
    bundle()
  }, time)
}

// concat and bundle css
function bundle () {
  const ordered = order(deps[postcssify.entry], [], {})
  const l = ordered.length
  let ast
  for (let i = 0; i < l; i++) {
    const file = ordered[i]
    const style = styles[file]
    if (style === void 0) {
      return
    } else {
      if (!ast) {
        ast = style.clone()
      } else {
        ast.append(style)
      }
    }
  }
  if (ast) {
    processor.process(ast.toResult(), { to: dest, map: true }).then((result) => {
      fs.writeFile(dest, result.css, (err) => {
        if (err) {
          throw err
        } else {
          log.info('updated: %s', postcssify.dest)
        }
      })
    }).catch((reason) => {
      throw new Error(reason)
    })
  }
}

// return cached realpath
function realpath (file) {
  return paths[file] || (paths[file] = fs.realpathSync(file))
}

// walk deps and return ordered array
function order (d, arr, visited) {
  for (let i in d) {
    if (!visited[i]) {
      let obj = d[i]
      visited[i] = true
      arr = arr.concat(order(obj, [], visited))
      if (css(i)) {
        arr.push(i)
      }
    }
  }
  return arr
}

// return readstream
function readstream () {
  return new stream.Readable({
    read () {},
    encoding: 'utf-8'
  })
}
