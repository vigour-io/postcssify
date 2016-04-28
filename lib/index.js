'use strict'

var path = require('path')
var isUrl = require('vigour-util/is/url')
var resolve = require('browser-resolve')
var cssnext = require('postcss-cssnext')
var through = require('through2')
var postcss = require('postcss')
var hh = require('http-https')
var fs = require('vigour-fs-promised')
var _reverse = require('lodash.reverse')
var _uniq = require('lodash.uniq')
var processor = postcss([cssnext])
var detective = require('detective')
var cssDetective = require('css-detective')

// regexp for importlines
var ri = /@import[^;]*;/g

var dest
var map
var mapDest

// transform that fires for each file in modules that have it defined in the package
var tr = module.exports = function postcssify (file, options) {
  dest = options.out
    ? path.resolve(options.out)
    : path.join(process.cwd(), 'bundle.css')

  if (typeof options.map === 'undefined') {
    map = true
  } else if (options.map === 'true') {
    map = true
  } else if (options.map === 'false') {
    map = false
  } else if (options.map === 'inline') {
    map = true
  } else {
    mapDest = options.map
  }
  if (/\.json/.test(file)) {
    // for json return usual stream
    return through()
  }

  // if we have deps stored for this one => clear these!
  // dont delete completely! would mess up the references
  if (tr.deps[file]) {
    for (var i in tr.deps[file]) {
      delete tr.deps[file][i]
    }
  }
  // add to pending
  wait()

  let stream
  let total = ''
  if (/\.css/.test(file)) {
    // clear css cache
    if (tr.cache[file]) {
      tr.cache[file] = ''
    }
    // for css return 'require(' + import + ')' for each import
    // add imports to the dependency tree
    // store the css body, stripped from imports to the cache object
    stream = through(function (buf, enc, next) {
      var chunk = buf.toString('utf8')
      // total += chunk
      var imports = cssDetective(chunk)
      var arr
      for (let i = 0, len = imports.length; i < len; i += 1) {
        if (isUrl(imports[i], { requireProtocol: true })) {
          // for urls => load it
          loadRemote(imports[i])
          // add to dependency tree
          addDep(file, imports[i])
        } else {
          // push a `require(` + import + `);`, for potential watchers
          stream.push(`require('` + imports[i] + `');`)
          // store in array
          ;(arr || (arr = [])).push(imports[i])
        }
      }

      // add deps
      if (arr && arr.length) {
        addDepsArr(file, arr)
      }

      if (!tr.cache[file]) {
        tr.cache[file] = ''
      }
      // strip the imports from body and store in cache
      tr.cache[file] += chunk.replace(ri, '')
      next()
    })

    stream.on('end', function () {
      parse(file)
    })
  } else {
    // first js file, gets stores as entry (is there a better way?)
    tr.entry = tr.entry || file
    // for js add all requires to the dependency tree (for correct order)
    stream = through(function (buf, enc, next) {
      var chunk = buf.toString('utf8')
      total += chunk
      this.push(chunk)
      next()
    })
  }
  // on end => remove from pending and maybe bundle
  stream.on('end', () => {
    var arr = detective(total)
    if (arr.length) {
      addDepsArr(file, arr)
    }
    done()
  })
  return stream
}

// store visited files
tr.paths = {}
// store the amount of files we still need to parse before bundling
tr.pending = 0
// store every file we get remotely, never requesting again
tr.remotes = {}
// store the body of each css file
tr.cache = {}
// store the dependency tree
tr.deps = {}
// store the entry point
tr.entry

function addDepsArr (file, arr) {
  if (arr) {
    var l = arr.length
    let cnt = l
    let i = 0
    wait()
    for (; i < l; i++) {
      let index = i
      resolve(arr[i], { filename: file }, (err, path) => {
        if (err) {
          // Errors are already correctly handled, ignoring...
        } else {
          fs.realpath(path, tr.paths, (err, resolvedPath) => {
            if (err) {
              console.error(err.stack || err)
            } else {
              tr.paths[path] = resolvedPath
              arr[index] = resolvedPath
              if (!--cnt) {
                for (let j = 0; j < l; j++) {
                  addDep(file, arr[j])
                }
                done()
              }
            }
          })
        }
      })
    }
  }
}

function addDep (file, path) {
  var deps = tr.deps
  // if not there => create dep object for this file
  if (!deps[file]) {
    deps[file] = {}
  }
  // if not there => create dep object for path to store (for referencing)
  if (!deps[path]) {
    deps[path] = {}
  }
  // store reference to required file object on file object
  deps[file][path] = deps[path]
}

function loadRemote (file) {
  // if not already loaded => load it
  if (!tr.remotes[file]) {
    tr.remotes[file] = true
    let cache = tr.cache
    let request = hh.get(file, function (response) {
      let body = ''
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('error', (err) => {
        done()
        console.error(err)
      })
      response.on('end', () => {
        cache[file] = body
        parse(file)
        done()
      })
    })
    request.on('error', (err) => {
      done()
      console.error(err)
    })
    request.end()
    wait()
  }
}

function wait () {
  // add to pending
  tr.pending += 1
}

function done () {
  // remove from pending and bundle if there is nothing pending
  setTimeout(() => {
    tr.pending -= 1
    if (!tr.pending) {
      bundle()
    }
  })
}

function parse (file) {
  // convert the string from file to postcss node
  var css = tr.cache[file]
  if (typeof css === 'string') {
    tr.cache[file] = postcss.parse(css, { from: file })
  }
  return tr.cache[file]
}

function bundle () {
  var sorted = _reverse(_uniq(_reverse(order(tr.deps[tr.entry]))))
  var l = sorted.length
  var i = 0
  var root
  for (; i < l; i++) {
    let file = sorted[i]
    let node = parse(file)
    if (node) {
      if (!root) {
        root = node
      } else {
        root = root.append(node)
      }
    }
  }
  if (root) {
    processor.process(root, {
      to: dest,
      map: {
        inline: map === true
      }
    }).then((result) => {
      let arr = [
        fs.writeFile(dest, result.css)
      ]
      if (mapDest) {
        arr.push(fs.writeFile(mapDest, result.map))
      }
      return Promise.all(arr)
    })
  }
}

function order (item, ordering) {
  if (!ordering) {
    ordering = {}
  }
  var arr = []
  // traverse dependencies recursively and add to sorted array
  for (let file in item) {
    if (!ordering[file]) {
      ordering[file] = true
      let obj = item[file]
      arr = arr.concat(order(obj, ordering))
      if (/\.css/.test(file)) {
        arr.push(file)
      }
      delete ordering[file]
    }
  }
  return arr
}
