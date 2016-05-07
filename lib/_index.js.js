'use strict'
var isUrl = require('vigour-util/is/url')
var resolve = require('browser-resolve')
var cssnext = require('postcss-cssnext')
var through = require('through2')
var postcss = require('postcss')
var hh = require('http-https')
var fs = require('fs')
var processor = postcss([cssnext])

// regex for requires (groups path)
var re = /(?:(?:var|const|let)\s*(.*?)\s*=\s*)?require\(['"]([^'"]+)['"](?:, ['"]([^'"]+)['"])?\);?/g
// regex for imports (groups path)
var im = /(@import ((url\(['"](.​*?)['"]\))|(['"](.*​?)['"])))/g
// regex for importlines
var ri = /@import[^;]*;/g

// transform that fires for each file in modules that have it defined in the package
var tr = module.exports = function postcssify (file, b) {
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
  if (/\.css/.test(file)) {
    // clear css cache
    if (tr.cache[file]) {
      tr.cache[file] = ''
    }
    // for css return 'require(' + import + ')' for each import
    // add imports to the dependency tree
    // store the css body, stripped from imports to the cache object
    stream = through(function (buf, enc, next) {
      collectImports(this, file, buf)
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
      collectRequires(this, file, buf)
      next()
    })
  }
  // on end => remove from pending and maybe bundle
  stream.on('end', done)
  return stream
}

// store visited files
tr.paths = {}
// store the amount of files we still need to parse before bundling
tr.pending = 0
// store the every file we get remotely, never requesting again
tr.remotes = {}
// store the body of each css file
tr.cache = {}
// store the dependency tree
tr.deps = {}
// store the entry point
tr.entry

function collectImports (stream, file, buf) {
  var data = buf.toString('utf8')
  var cache = tr.cache
  var result
  var arr

  // find every import
  while ((result = im.exec(data))) {
    let id = result[2].replace(/['"]+/g, '')
    if (isUrl(id)) {
      // for urls => load it
      loadRemote(id)
      // add to dependency tree
      addDep(file, id)
    } else {
      console.log(file, 'adding', `require('` + id + `');`)
      // push a `require(` + import + `);`, for potential watchers
      stream.push(`require('` + id + `');`)
      // store in array
      ;(arr || (arr = [])).push(id)
    }
  }
  // add deps
  addDepsArr(file, arr)

  if (!cache[file]) {
    cache[file] = ''
  }
  // strip the imports from body and store in cache
  cache[file] += data.replace(ri, '')
}

function collectRequires (stream, file, buf) {
  var data = buf.toString('utf8')
  var result
  var arr
  // find every require() => collect in array
  while ((result = re.exec(data))) {
    let id = result[2]
    ;(arr || (arr = [])).push(id)
  }
  // add deps
  addDepsArr(file, arr)
  // push the unaltered data to stream
  stream.push(data)
}

function addDepsArr (file, arr) {
  if (arr) {
    var l = arr.length
    let cnt = l
    let i = 0
    wait()
    for (; i < l; i++) {
      let index = i
      resolve(arr[i], { filename: file }, (err, path) => {
        fs.realpath(path, tr.paths, (err, resolvedPath) => {
          if (err) throw err
          tr.paths[path] = resolvedPath
          arr[index] = resolvedPath
          if (!--cnt) {
            for (let j = 0; j < l; j++) {
              addDep(file, arr[j])
            }
            done()
          }
        })
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
      response.on('data', (chunk) => body += chunk.toString())
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
  var sorted = order(tr.deps[tr.entry], [])
  var l = sorted.length
  var i = 0
  var str = ''
  for (; i < l; i++) {
    let file = sorted[i]
    let node = parse(file)
    if (node) {
      str += node.toResult().css
    }
  }
  if (str) {
    let dest = 'bundle.css'
    processor.process(str, {
      to: dest,
      map: true
    }).then((result) => {
      fs.writeFile(dest, result.css, (err) => { if (err) throw err })
    })
  }
}

function order (d, arr) {
  // traverse dependencies recursively and add to sorted array
  for (let i in d) {
    let obj = d[i]
    arr = arr.concat(order(obj, []))
    if (/\.css/.test(i)) {
      arr.push(i)
    }
  }
  return arr
}
