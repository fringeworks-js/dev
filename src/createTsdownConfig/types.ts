import type { CreateExportsOptions } from '../createExports';

export type CreateTsdownConfigOptions = {
  /**
   * CSS を含むパッケージ向けの設定を有効にする
   *
   * - `css.inject`: CSS を import したモジュールの出力に、CSS ファイルの import を残す
   * - `package.json` の `sideEffects` を `['**\/*.css']` にする
   * - CJS の出力で、CSS を指す `require` の拡張子を `.css` に直す
   *
   * @default false
   */
  css?: boolean;

  /**
   * `package.json` の `exports` を作る `createExports` に渡すオプション
   * `target` は常に `'dist'` になり、`extraExports` には `./package.json` が加わる
   */
  exports?: Omit<CreateExportsOptions, 'target'>;

  /**
   * ビルドの対象
   * 既定値は `src` 配下の `.ts`・`.tsx`（テスト・型定義のファイルを除く）
   */
  entry?: string[];

  /**
   * `LICENSE`・`README.md`・`README.ja.md`・`CHANGELOG.md`（存在するもの）に加えて、出力先にコピーするファイル
   * 指定したファイルが存在しない場合はビルドがエラーになる
   */
  copyFiles?: string[];
};
