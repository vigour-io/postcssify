'use strict'

module.exports = exports = function logError (msg) {
  return function (reason) {
    console.error(msg, reason.stack || reason)
  }
}
