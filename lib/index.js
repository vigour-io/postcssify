'use strict'

var path = require('path')
var through = require('through2')
var postcss = require('postcss')
var getImports = require('postcss-import')
var _isArray = require('lodash.isarray')
var fs = require('vigour-fs-promised')

var bundle = {
  add: function add (file) {
    if (!this.contents) {
      this.contents = {}
      this.first = file
      this.last = file
      return this.add(file)
    }
    if (this.contents[file]) {
      if (this.contents[file].prev) {
        this.contents[this.contents[file].prev].next = this.contents[file].next
      }
      this.contents[file].prev = this.last
      this.contents[file].next = null
      this.last = file
    } else {
      this.contents[file] = {
        buf: new Buffer('')
      }
      if (this.last !== file) {
        this.contents[file].prev = this.last
      }
      this.contents[this.last].next = file
      this.last = file
    }
  },
  append: function append (file, buf) {
    this.contents[file].buf += buf
  },
  reset: function reset () {
    this.contents = null
    this.first = null
    this.last = null
  }
}
var importProcessor = postcss([getImports])

module.exports = exports = function postcssify (brow, options) {
  options = options || {}
  var outFile = options.out
    ? path.resolve(options.out)
    : path.join(process.cwd(), 'bundle.css')
  brow.transform(exports.transform, options)
  var wrap = brow.pipeline.get('wrap')
  wrap.push(through(function (buf, enc, next) {
    this.push(buf)
    next()
  }, function (next) {
    exports.mergeASTs(options)
      .then((ast) => {
        options.plugins = _isArray(options.plugins)
          ? options.plugins
          : [options.plugins]
        // console.log('options.plugins', options.plugins)
        return postcss(options.plugins).process(ast)
      })
      .then((ast) => {
        // console.log('AST', 'after', JSON.stringify(ast, null, 2))
        return fs.writeFileAsync(outFile, ast.css, 'utf8')
      })
      .then(() => {
        next()
      })
      .catch((reason) => {
        console.error('Nooo', reason.stack)
      })
  }))
}

exports.mergeASTs = function (options) {
  var ast
  var curr = bundle.first
  var prom = Promise.resolve()
  while (curr) {
    ;(function (_curr) {
      prom = prom.then(() => {
        return importProcessor.process(bundle.contents[_curr].buf.toString(), {
          from: _curr
        })
          .then((result) => {
            if (!ast) {
              ast = result
            } else {
              ast.root.append(result.root)
            }
          })
      })
    }(curr))
    curr = bundle.contents[curr].next
  }
  return prom.then(() => {
    // console.log('AST', 'before', JSON.stringify(ast, null, 2))
    return ast
  })
}

exports.transform = function transform (file, options) {
  console.log('FILE', file)
  return through(
    file.indexOf('.css') !== -1
      ? exports.cssTransformFactory(file, options)
      : exports.noopFactory(file, options)
  )
}

exports.cssTransformFactory = function cssTransformFactory (file, options) {
  // console.log('cssTransform', file)
  bundle.add(file)
  return function cssTransform (buf, enc, next) {
    bundle.append(file, buf)
    this.push(null)
    next()
  }
}

exports.noopFactory = function noopFactory (file, options) {
  // console.log('noop', file)
  return function noop (buf, enc, next) {
    this.push(buf)
    next()
  }
}
