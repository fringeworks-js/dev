/// <reference types="vitest/globals" />

// prettier-plugin-organize-imports はオプションの型（prettier.d.ts）だけを同梱し、モジュールの型を持たない
declare module 'prettier-plugin-organize-imports' {
  import type { Plugin } from 'prettier';

  const plugin: Plugin;
  export default plugin;
}
