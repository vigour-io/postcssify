'use strict'
// @todo finish this import thing bulletproof
const config = require('./config')
const hasimport = /^(\s*?)@import ((url\((['"]?)([^\s]*?)(['"]?)\))|((['"]?)([^\s]*?)(['"]?)))(\s*?);/
const hasrequire = /require(\s*?)\((\s*?)["'](.*?)["'](\s*?)\)/
const commentstart = /^(\s*?)\/\*/
const commentend = /\*\//
const comment = /^(\s*?)\/\//
const hasurl = /^https:\/\/|^http:\/\//
const cssignore = config.ignoremark
const isparsed = new RegExp(cssignore)
const json = /\.json/
const css = /\.css/

exports.imported = (str) => hasimport.exec(str)[9]
exports.required = (str) => hasrequire.exec(str)[3]
exports.relevant = (str) => str && !comment.test(str)
exports.commentstart = (str) => commentstart.test(str)
exports.commentend = (str) => commentend.test(str)
exports.hasrequire = (str) => hasrequire.test(str)
exports.hasimport = (str) => hasimport.test(str)
exports.isparsed = (str) => isparsed.test(str)
exports.hasurl = (str) => hasurl.test(str)
exports.json = (str) => json.test(str)
exports.css = (str) => css.test(str)
