<!-- VDOC.badges travis; standard; npm; coveralls -->
<!-- DON'T EDIT THIS SECTION (including comments), INSTEAD RE-RUN `vdoc` TO UPDATE -->
[![Build Status](https://travis-ci.org/vigour-io/postcssify.svg?branch=master)](https://travis-ci.org/vigour-io/postcssify)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/postcssify.svg)](https://badge.fury.io/js/postcssify)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/postcssify/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/postcssify?branch=master)

<!-- VDOC END -->

# postcssify
[Browserify](http://browserify.org/) plugin for postcss (*[watchify](https://github.com/substack/watchify) support coming soon!*)

## Install
```sh
npm install postcssify --save-dev
```

## Usage
*entry.js*
```javascript
require('some.css')
```

```sh
$ browserify entry.js -o bundle.js\
  -p [ postcssify\
    --filePlugins postcss-import\
    --filePlugins postcss-import-url\
    --plugins postcss-cssnext\
    --plugins cssnano\
    --out build.css\
    --no-map
  ]
```
Notice the [subarg](https://github.com/substack/subarg) syntax. You can also use the browserify [Javascript API](https://github.com/substack/node-browserify#bpluginplugin-opts)

## Options

- **filePlugins** - npm package name of plugins to run against each individual required CSS file
- **plugins** (*array*)- npm package names of plugins to run against the result of merging all required CSS files
- **out** - name of produced bundle (defaults to `bundle.css`)
- **map** - name of produced source map file. Set to `false` if you don't want to produce source maps at all. Set to `true` or `inline` if you want the source map inlined in the CSS bundle (this is the default).

## Dependencies
`npm install -g browserify` or `npm install -g watchify` (coming soon)


Don't forget to install the postcss plugins you want to use

```sh
$ npm i postcss-import postcss-import-url postcss-cssnext cssnano --save-dev
```

## CSS merge order

When the files are merged, postcssify preserves the order one would normally expect from `require`. If the required javascript would execute first in node, that CSS appears first in the bundle. For example, consider the following files, all living in the same directory

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

Let's create the CSS bundle (`browserify entry.js -p postcssify`):

*bundle.css*
```css
/* css from main.css */
/* css from component.css */
/* css from finalTouches.css */
/* Base64-encoded source map */
```

## Node.js

If you want to run the same code in node, you'll need to tell it to ignore `.css` files. One way of doing this is using [vigour-util's `require`](https://github.com/vigour-io/util#enhancerequireoptions):

```javascript
var enhanceRequire = require('vigour-util/require')
enhanceRequire()
require('entry.js') // required styles will simply be ignored
enhanceRequire.restore()
```
