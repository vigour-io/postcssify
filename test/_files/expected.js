(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;require('./moreafter.css');
},{"./moreafter.css":7}],2:[function(require,module,exports){
;require('./morebefore.css');
},{"./morebefore.css":8}],3:[function(require,module,exports){
;require('./moreComponent.css');
},{"./moreComponent.css":6}],4:[function(require,module,exports){
'use strict'

require('./entry.js')
require('./requiredtwice.css')
require('./component.css')

module.exports = exports = 'component'

},{"./component.css":3,"./entry.js":5,"./requiredtwice.css":10}],5:[function(require,module,exports){
'use strict'

require('./before.css')
var component = require('./component')
console.log('component', component)
require('./after.css')
require('./requiredtwice.css')

// commented requires should be ignored: require('ignored.css')

},{"./after.css":1,"./before.css":2,"./component":4,"./requiredtwice.css":10}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
;require('./requiredtwice.css');
},{"./requiredtwice.css":10}],10:[function(require,module,exports){
;require('./other.css');
},{"./other.css":9}]},{},[5]);
