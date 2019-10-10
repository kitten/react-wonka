import { basename } from 'path';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from 'rollup-plugin-buble';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import transformPipe from './scripts/transform-pipe';

const pkgInfo = require('./package.json');
const external = ['dns', 'fs', 'path', 'url'];
const name = basename(pkgInfo.main, '.js');

if (pkgInfo.peerDependencies)
  external.push(...Object.keys(pkgInfo.peerDependencies));
if (pkgInfo.dependencies)
  external.push(...Object.keys(pkgInfo.dependencies));

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
const externalTest = id => externalPredicate.test(id);

const terserMinified = terser({
  warnings: true,
  ecma: 5,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  },
  output: {
    comments: false
  }
});

const plugins = [
  nodeResolve({
    mainFields: ['module', 'jsnext', 'main'],
    browser: true
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//
  }),
  typescript({
    typescript: require('typescript'),
    cacheRoot: './node_modules/.cache/.rts2_cache',
    useTsconfigDeclarationDir: true,
    tsconfigOverride: {
      compilerOptions: {
        declaration: true,
        declarationDir: './dist/types/',
        target: 'es6',
      },
    },
  }),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      transformPipe,
      'babel-plugin-closure-elimination',
      '@babel/plugin-transform-object-assign',
    ]
  }),
  terserMinified
].filter(Boolean);

const config = {
  input: './src/index.ts',
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  }
};

export default {
  ...config,
  plugins,
  output: [
    {
      sourcemap: false,
      legacy: true,
      freeze: false,
      file: `./dist/${name}.js`,
      format: 'cjs'
    },
    {
      sourcemap: false,
      legacy: true,
      freeze: false,
      file: `./dist/${name}.es.js`,
      format: 'esm'
    }
  ]
};
