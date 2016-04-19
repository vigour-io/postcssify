# postcssify
Browserify transform for postcss

## Install

`npm i postcssify`

## Usage

`browserify <entry> -p [postcssify --plugins <plugins> --out <cssOut>] -o <jsOut>`

- `entry`: the entry file for browserify (see [browserify docs](https://github.com/substack/node-browserify#usage))
- `plugins`: postcss plugin package name, e.g. `postcss-cssnext`.
  + You can pass multiple plugins by repeating this argument, e.g. `--plugins postcss-cssnext --plugins postcss-canadian-stylesheets`.
  + Don't forget to install the plugins you use, e.g. `npm i postcss-cssnext postcss-canadian-stylesheets`
- `cssOut`: path where to save the resulting CSS
- `jsOut`: path where to save the resulting JS (see [browserify docs](https://github.com/substack/node-browserify#usage) and look for `--outfile, -o`)

## Source maps

Tell postcssify to generate source maps with `--map`

`browserify <entry> -p [postcssify --plugins <plugin> --out <cssOut> --map <mapOption>] -o <jsOut>`

- `mapOption`:
  + Set to `true` to create inline source maps. This is the default.
  + Set to a string to create a source map and save it at the specified file path, e.g. `--map out.css.map`
  + Set to `false` to tell postcssify **not** to create source maps. This speeds up the whole process a little bit.