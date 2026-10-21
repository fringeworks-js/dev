import { posix as path } from 'path';
import type { Rolldown } from 'tsdown';

/**
 * 相対パスで `.cjs` を指す `require`
 */
const CJS_REQUIRE = /require\((['"])(\.{1,2}\/[^'"]*)\.cjs\1\)/g;

/**
 * CJS の出力で、CSS を指す `require` の拡張子を `.css` に直すプラグインを作る
 *
 * `@tsdown/css` の `css.inject` は ESM の import 文だけを CSS ファイルに書き換えるため、
 * CJS では出力されない `.cjs`（CSS だけのチャンク）を `require` したままになる
 */
export default function createFixCssRequirePlugin(): Rolldown.Plugin {
  return {
    name: 'fringeworks:fix-css-require',
    generateBundle: {
      // CSS ファイルが出力された後に処理する
      order: 'post',
      handler(options, bundle) {
        if (options.format !== 'cjs') {
          return;
        }
        const cssFiles = new Set(
          Object.keys(bundle).filter((fileName) => fileName.endsWith('.css')),
        );
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') {
            continue;
          }
          const dir = path.dirname(chunk.fileName);
          chunk.code = chunk.code.replace(
            CJS_REQUIRE,
            (match, quote: string, specifier: string) =>
              cssFiles.has(path.join(dir, `${specifier}.css`))
                ? `require(${quote}${specifier}.css${quote})`
                : match,
          );
        }
      },
    },
  };
}
