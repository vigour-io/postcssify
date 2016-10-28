# postcssify

[![Build Status](https://travis-ci.org/vigour-io/postcssify.svg?branch=master)](https://travis-ci.org/vigour-io/postcssify)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/postcssify.svg)](https://badge.fury.io/js/postcssify)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/postcssify/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/postcssify?branch=master)

[Browserify](http://browserify.org/) plugin for postcss

## Install
```sh
npm install postcssify --save-dev
```

## Usage
*entry.js*
```js
require('some.css')
```

```sh
$ browserify entry.js -o build.js -t postcssify --css bundle.css
```

## CSS merge order

When the files are merged, postcssify preserves the order one would normally expect from `require`. If the required javascript would execute first in node, that CSS appears first in the bundle. For example, consider the following files, all living in the same directory.

*entry.js*
```javascript
require('main.css')
require('component.js')
require('finalTouches.css')
```

*component.js*
```javascript
require('component.css')
```

*bundle.css*
```css
/* css from main.css */
/* css from component.css */
/* css from finalTouches.css */
/* Base64-encoded source map */
```

## Node.js

If you want to run the same code in node, you'll need to tell it to ignore `.css` files. One way of doing this is using the [enhance-require](https://www.npmjs.com/package/enhance-require) package (hacky but makes it easy).

```javascript
const enhanceRequire = require('enhance-require')
enhanceRequire() // overwrites require
require('entry.js') // required styles will be ignored
enhanceRequire.restore() // restores require
```
