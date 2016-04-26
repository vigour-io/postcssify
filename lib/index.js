'use strict'
var isUrl = require('vigour-util/is/url')
var resolve = require('browser-resolve')
var through = require('through2')
var hh = require('http-https')

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
  if (tr.deps[file]) {
    for (var i in tr.deps[file]) {
      delete tr.deps[file][i]
    }
  }

  let stream
  if (/\.css/.test(file)) {
    // for css return 'require(' + import + ')' for each import
    // add imports to the dependency tree
    // store the css body, stripped from imports to the cache object
    stream = through(function (buf, enc, next) {
      collectImports(this, file, buf, enc, next)
    })
  } else {
    // first js file, gets stores as entry (is there a better way?)
    tr.entry = tr.entry || file
    // for js add all requires to the dependency tree (for correct order)
    stream = through(function (buf, enc, next) {
      collectRequires(this, file, buf, enc, next)
    })
  }

  // add to pending
  wait()
  // on end => remove from pending and maybe bundle
  stream.on('end', done)
  return stream
}

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

function collectImports (stream, file, buf, enc, next) {
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
      // push a `require(` + import + `);`, for potential watchers
      stream.push(`require('` + id + `');`)
      // store in array
      ;(arr || (arr = [])).push(id)
    }
  }
  // add deps
  addDeps(file, arr)

  if (!cache[file]) {
    cache[file] = ''
  }
  // strip the imports from body and store in cache
  cache[file] += data.replace(ri, '')
  next()
}

function collectRequires (stream, file, buf, enc, next) {
  var data = buf.toString('utf8')
  var result
  var arr
  // find every require() => collect in array
  while ((result = re.exec(data))) {
    let id = result[2]
    if (id[0] === '.') {
      (arr || (arr = [])).push(id)
    }
  }
  // add deps
  addDeps(file, arr)
  // push the unaltered data to stream
  stream.push(data)
  next()
}

function addDeps (file, arr) {
  if (arr) {
    var l = arr.length
    let cnt = l
    wait()
    for (let i = 0; i < l; i++) {
      let index = i
      resolve(arr[i], { filename: file }, function (e, path) {
        arr[index] = path
        if (!--cnt) {
          for (let j = 0; j < l; j++) {
            addDep(file, arr[j])
          }
          done()
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
      response.on('data', (chunk) => body += chunk.toString())
      response.on('end', () => {
        cache[file] = body
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
  tr.pending -= 1
  if (!tr.pending) {
    bundle()
  }
}

function bundle () {
  // SORT:sort the dependencies

  let sorted = order(tr.deps[tr.entry], [])
  console.log('SORTED:', sorted)
  // CONCAT: loop through sorted list => concat each body stored in cache
  // POSTCSS: apply all postcss
  // OUTPUT: render postcss AST 
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
