'use strict'

var path = require('path')
var through = require('through2')
var postcss = require('postcss')
var getImports = require('postcss-import')
var _isArray = require('lodash.isarray')
var _isEmpty = require('lodash.isempty')
var _flatten = require('lodash.flatten')
var _sortBy = require('lodash.sortby')
var _reverse = require('lodash.reverse')
var _uniq = require('lodash.uniq')
var fs = require('vigour-fs-promised')

var importProcessor = postcss([getImports])

var bundle = {
  files: {

  },
  meta: {

  },
  add: function add (file) {
    if (!this.files[file]) {
      this.files[file] = {
        buf: new Buffer('')
      }
    }
  },
  append: function append (file, buf) {
    this.files[file].buf += buf
  },
  addMeta: function addMeta (row) {
    var index = row.index
    if (!this.meta[index]) {
      this.meta[index] = row
      if (row.entry) {
        this.entry = index
      }
    } else {
      throw new Error('meta already exists....')
    }
  },
  reset: function reset () {
    this.files = {}
  }
}

module.exports = exports = function postcssify (brow, options) {
  options = options || {}

  var outFile = options.out
    ? path.resolve(options.out)
    : path.join(process.cwd(), 'bundle.css')

  brow.transform(exports.transform, options)

  brow.pipeline.get('sort').push(
    through.obj(function (row, enc, next) {
      bundle.addMeta(row)
      this.push(row)
      next()
    })
  )

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

exports.sortRows = function (row) {
  var deps = []
  delete row.indexDeps.dup
  if (!_isEmpty(row.indexDeps)) {
    for (let key in row.indexDeps) {
      var pattern = 'require\\((?:(?:\'' + key + '\')|(?:"' + key + '"))\\)'
      var re = new RegExp(pattern + '(?![\\s\\S]*' + pattern + ')')
      var matches = row.source.match(re)
      deps.push({
        index: row.indexDeps[key],
        pos: matches.index
      })
    }
    deps = _sortBy(deps, 'pos')
    return Promise.all(deps.map((item) => {
      return exports.sortRows(bundle.meta[item.index])
    }))
      .then((vals) => {
        return _flatten(vals)
      })
  } else {
    return row.index
  }
}

exports.mergeASTs = function (options) {
  var entry = bundle.meta[bundle.entry]
  return exports.sortRows(entry)
    .then((vals) => {
      var unique = _reverse(_uniq(_reverse(vals)))
      return unique.reduce(function (prev, curr) {
        var ast
        return prev.then((_ast) => {
          ast = _ast
          var file = bundle.meta[curr].file
          return importProcessor.process(bundle.files[file].buf.toString(), {
            from: file
          })
        })
        .then((result) => {
          if (!ast) {
            ast = result
          } else {
            ast.root.append(result.root)
          }
          return ast
        })
      }, Promise.resolve())
    })
}

// var ast
// var curr = bundle.first
// var prom = Promise.resolve()
// while (curr) {
//   ;(function (_curr) {
//     prom = prom.then(() => {
//       return importProcessor.process(bundle.contents[_curr].buf.toString(), {
//         from: _curr
//       })
//         .then((result) => {
//           // console.log('result for ' + _curr, JSON.stringify(result, null, 2))
//           // console.log('result for ' + _curr + '\n', result.css)
//           if (!ast) {
//             ast = result
//           } else {
//             ast.root.append(result.root)
//           }
//         })
//     })
//   }(curr))
//   curr = bundle.contents[curr].next
// }
// return prom.then(() => {
//   // console.log('AST', 'before', JSON.stringify(ast, null, 2))
//   return ast
// })

exports.isHandled = function isHandled (file, options) {
  return (options.include && options.include(file)) || file.indexOf('.css') !== -1
}

exports.transform = function transform (file, options) {
  return through(
    exports.isHandled(file, options)
      ? exports.cssTransformFactory(file, options)
      : exports.noopFactory(file, options)
  )
}

exports.cssTransformFactory = function cssTransformFactory (file, options) {
  bundle.add(file)
  return function cssTransform (buf, enc, next) {
    bundle.append(file, buf)
    this.push(null)
    next()
  }
}

exports.noopFactory = function noopFactory (file, options) {
  return function noop (buf, enc, next) {
    this.push(buf)
    next()
  }
}
