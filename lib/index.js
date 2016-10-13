'use strict'
const isBuiltinModule = require('is-builtin-module')
const bresolve = require('browser-resolve')
const log = require('bole')('postcssify')
const readline = require('readline')
const through = require('through2')
const postcss = require('postcss')
const stream = require('stream')
const fs = require('fs')
var processors = [
  require('postcss-cssnext'),
  require('postcss-calc')
  // require('postcss-url')
]

// config
const config = require('./config')
const ignoremark = config.ignoremark
var extensions
var cssObjExport = {}

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
var styles = postcssify.styles
var resolved = postcssify.resolved
var paths = postcssify.paths
var deps = postcssify.deps
var dest = postcssify.dest

// transform
module.exports = function transform (file, b) {
  if (b.dest && dest !== b.dest) {
    dest = b.dest
    delete postcssify.entry
    postcssify.styles = {}
    postcssify.paths = {}
    postcssify.deps = {}
  }

  extensions = [ '.js', '.json' ].concat(b._flags.extensions || [])

  if (!json(file) && init(file)) {
    return css(file) ? csstransform(file) : jstransform(file)
  } else {
    return through()
  }
}

// init => returns false if no dest is defined
function init (file) {
  if (!postcssify.entry) {
    if (dest) {
      log.info('output: %s', dest)
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
          if (!commentend(line)) {
            commentblock = true
          }
        } else if (hasrequire(line)) {
          var req
          while(req = required(line)) {
            if (!isBuiltinModule(req.uri)) {
              (requires || (requires = [])).push(req)
            }
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
  const realPath = realpath(file)
  let commentblock, collected, secondpass
  var imports = []
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
            return imports.push({uri: importfile, isSet: !!cssObjExport[realPath]})
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
        styles[realPath] = postcss.parse(cssbody, { from: realPath })
        if (!collected) {
          collect(imports, file, true)
        }

        if (cssObjExport[realPath]) {
          this.push(
            [
              ignoremark,
              'const Base = require(\'vigour-base\')',
              'const base = new Base()'
            ]
              .concat(imports.map(f => `base.set(require('${f.uri}').serialize)`))
              .concat(`base.set(${JSON.stringify(getCssVars(styles[realPath]), null, 2)})`)
              .concat('module.exports = base')
              .join('\n') + '\n'
          )
        } else {
          this.push([ignoremark].concat(imports.map(f => `require('${f.uri}')`)).join('\n') + '\n')
        }

        flush()
      })
      readable.push(null)
    }
  })
}

function getCssVars (ast, selector, vars) {
  if (!vars) { vars = {} }
  if (ast.nodes) {
    ast.nodes.forEach(n => getCssVars(n, ast.selector, vars))
  }
  if (ast.type === 'decl' && selector && ast.prop.substr(0, 2) === '--') {
    if (!vars[selector]) {
      vars[selector] = {}
    }

    var val = ast.value
    if (val.substr(0, 6) === 'var(--') {
      val = `$root.${selector}.${val.slice(6, -1)}`
    }
    vars[selector][ast.prop.substr(2)] = val
  }
  return vars
}

// collect requires/imports
function collect (files, file, rebundle) {
  if (files) {
    file = realpath(file)
    Promise.all(files.filter(f => css(f.uri)).map(f => resolveReal(f, file)))
      .then(files => {
        files.forEach(f => {
          if (f.isSet) {
            cssObjExport[f.uri] = true
          }
        })
      })

    postcssify.collectTimer = postcssify.collectTimer || {}
    if (postcssify.collectTimer[file]) { clearTimeout(postcssify.collectTimer[file]) }
    postcssify.collectTimer[file] = setTimeout(() => {
      preparedep(file)
      Promise.all(files.map(f => resolveReal(f, file)))
        .then(files => {
          files.forEach(f => {
            if (!deps[f.uri]) {
              deps[f.uri] = {}
            }

            deps[file][f.uri] = deps[f.uri]
            debouncebundle(100)
          })
        })
    }, 100)
  } else if (rebundle) {
    debouncebundle(200)
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
    postcss(processors).process(ast.toResult(), { to: dest, map: true }).then((result) => {
      fs.writeFile(dest, result.css, (err) => {
        if (err) {
          throw err
        } else {
          log.info('updated: %s', dest)
        }
      })
    }).catch((err) => log.error(err))
  }
}

function resolveReal (file, from) {
  const mark = `${file}#${from}`
  return resolved[mark] ? Promise.resolve(resolved[mark])
    : new Promise((resolve, reject) => {
      bresolve(file.uri, { filename: from, extensions: extensions }, (err, result) => {
        if (err) {
          return reject(err)
        }

        file.uri = realpath(result)
        resolved[mark] = file
        resolve(resolved[mark])
      })
    })
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
