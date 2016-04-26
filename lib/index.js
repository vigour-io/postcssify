'use strict'
var isUrl = require('vigour-util/is/url')
var resolve = require('browser-resolve')
var through = require('through2')
var hh = require('http-https')

var re = /(?:(?:var|const|let)\s*(.*?)\s*=\s*)?require\(['"]([^'"]+)['"](?:, ['"]([^'"]+)['"])?\);?/g
var im = /(@import ((url\(['"](.​*?)['"]\))|(['"](.*​?)['"])))/g
var ri = /@import[^;]*;/g

var tr = module.exports = function postcssify (file, b) {
  if (/\.json/.test(file)) {
    return through()
  }
  let stream
  if (/\.css/.test(file)) {
    stream = through(function (buf, enc, next) {
      collectImports(this, file, buf, enc, next)
    })
  } else {
    tr.entry = tr.entry || file
    stream = through(function (buf, enc, next) {
      collectRequires(this, file, buf, enc, next)
    })
  }

  wait()
  stream.on('end', done)
  return stream
}

// store the amount of files we still need to parse before bundling
tr.pending = 0
// store the every file we get remotely, never requesting again
tr.remotes = {}
// store the body of each css file
tr.cache = {}
// store the body of each css file
tr.queue = {}
// store the dependency tree
tr.deps = {}
// store the entry point
tr.entry

function collectImports (stream, file, buf, enc, next) {
  var data = buf.toString('utf8')
  var cache = tr.cache
  var result
  while ((result = im.exec(data))) {
    let id = result[2].replace(/['"]+/g, '')
    if (isUrl(id)) {
      loadRemote(id)
      addDeps(file, id)
    } else {
      wait()
      resolve(id, { filename: file }, (e, path) => {
        addDeps(file, path)
        done()
      })
      stream.push(`require('` + id + `');`)
    }
  }
  if (!cache[file]) {
    cache[file] = ''
  }
  cache[file] += data.replace(ri, '')
  next()
}

function collectRequires (stream, file, buf, enc, next) {
  var data = buf.toString('utf8')
  var result

  if (tr.deps[file]) {
    for (let i in tr.deps[file]) {
      delete tr.deps[file][i]
    }
    console.log('deleted a bunch', file, tr.deps[file])
  }

  while ((result = re.exec(data))) {
    let id = result[2]
    if (id[0] === '.') {
      wait()
      resolve(id, { filename: file }, (e, path) => {
        addDeps(file, path)
        done()
      })
    }
  }
  stream.push(data)
  next()
}

function addDeps (file, path) {
  var deps = tr.deps
  if (!deps[file]) {
    deps[file] = {}
  }
  if (!deps[path]) {
    deps[path] = {}
  }
  deps[file][path] = deps[path]
}

function loadRemote (file) {
  if (!tr.remotes[file]) {
    tr.remotes[file] = true
    let cache = tr.cache
    let request = hh.get(file, function (response) {
      let body = ''
      response.on('data', (chunk) => body += chunk.toString())
      response.on('end', () => {
        cache[file] = body
        done(file)
      })
    })
    request.on('error', (err) => {
      done(file)
      console.error(err)
    })
    request.end()
    wait()
  }
}

function wait () {
  tr.pending += 1
}

function done () {
  tr.pending -= 1
  if (!tr.pending) {
    bundle()
  }
}

function bundle () {
  console.log('deps:', JSON.stringify(tr.deps[tr.entry], false, 2))
  let sorted = order(tr.deps[tr.entry], [])
  console.log('sorted:', sorted)
}

function order (d, arr) {
  for (let i in d) {
    let obj = d[i]
    arr = arr.concat(order(obj, []))
    if (/\.css/.test(i)) {
      arr.push(i)
    }
  }
  return arr
}
