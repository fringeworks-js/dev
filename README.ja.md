# @fringeworks/dev

`@fringeworks/dev` は開発者向けの、誰かにとっては便利なライブラリです。\
index ファイルの生成、`package.json` の編集、バンドラーの `external` 設定など、パッケージ開発のビルドやスクリプトで使う処理を集めています。

**[English README is available here](./README.md)**

## インストール

```sh
npm install -D @fringeworks/dev
```

Node.js 上で動くスクリプトや、ビルドツールの設定ファイルから使うことを想定しています。

## 使い方

各関数は、パッケージのルートまたは関数名のサブパスから読み込めます。

```ts
import { generateIndexFiles } from '@fringeworks/dev';
import generateIndexFiles from '@fringeworks/dev/generateIndexFiles';
```

### index ファイルの生成

`src` 配下の各ディレクトリに、配下のモジュールを export する `index.ts` を生成します。

```ts
// scripts/indexes.ts
import generateIndexFiles from '@fringeworks/dev/generateIndexFiles';

generateIndexFiles();
```

既定では、各機能のディレクトリの index で主となるモジュールを default export と名前付き export の両方で export し、カテゴリーとルートの index では `export *` で引き継ぎます。次のようなファイル構成から、

```
src/
├── number/
│   └── keepInRange/
│       ├── constants.ts
│       ├── keepInRange.ts
│       ├── keepInRange.test.ts
│       └── types.ts
└── _internal/
    └── helper.ts
```

次の index ファイルが生成されます。名前が `_` で始まるディレクトリ・ファイルとテストファイルは対象になりません。

```ts
// src/number/keepInRange/index.ts
export * from './constants';
export { default as keepInRange, default } from './keepInRange';
export type * from './types';

// src/number/index.ts
export * from './keepInRange';

// src/index.ts
export * from './number';
```

利用者は、どのパスからでも同じ名前で import できます。

```ts
import { keepInRange, RangeMode } from 'my-package';
import { keepInRange } from 'my-package/number';
import keepInRange from 'my-package/number/keepInRange';
```

default export と名前付き export を同じファイルから export するため、CJS も出力する場合は、ビルドの出力設定を `exports: 'named'` にして混在の警告を抑えます。

### バンドラーの `external` 設定

相対パスと `src/` 配下以外の import を外部モジュールとして扱う関数を作ります。rolldown・rollup・tsdown などの `external` に渡せます。

```ts
// tsdown.config.ts
import createExternal from '@fringeworks/dev/createExternal';
import { defineConfig } from 'tsdown';

export default defineConfig({
  inputOptions: {
    external: createExternal(),
  },
});
```

### TypeScript で定義したクラス名を Sass で使う

```ts
import createSassClassNameFunction from '@fringeworks/dev/createSassClassNameFunction';
import * as sass from 'sass';

const CLASS_NAMES = { stack: 'frg-layout-stack' };

sass.compile('style.scss', {
  functions: {
    'cls($name)': createSassClassNameFunction(CLASS_NAMES),
  },
});
```

```scss
.#{cls('stack')} {
  display: flex;
}
```

## API

| 関数                                                | 説明                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `generateIndexFiles(options?)`                      | ディレクトリ配下の index ファイルを生成する                          |
| `createExports(options?)`                           | ディレクトリ配下のモジュールから `exports` の値を作る                |
| `writeExports(options?)`                            | `createExports` の結果を `package.json` の `exports` に書き込む      |
| `addJsExtensions(dir)`                              | ビルド後の JavaScript ファイルの相対 import に拡張子を付ける         |
| `createExternal(options?)`                          | バンドラーの `external` オプションに渡す関数を作る                   |
| `createSassClassNameFunction(classNames, options?)` | TypeScript で定義したクラス名を返す Sass のカスタム関数を作る        |
| `generatePublishPackageJson(options?)`              | 公開用の `package.json` を生成する                                   |
| `editJsonFile(jsonFilePath, editor)`                | JSON ファイルを編集する                                              |
| `installFromLocal(localNodeModulesPath, options?)`  | ローカルに置いたパッケージを `node_modules` にコピーする             |
| `setVersion(version, options?)`                     | ワークスペースと各パッケージの `package.json` にバージョンを反映する |
| `moveFilesToSubdirs(dirPath, options?)`             | ディレクトリ直下のファイルを同名のサブディレクトリに移動する         |
| `removeFiles(source, options?)`                     | glob パターンに一致するファイルを削除する                            |
| `checkExistence(...targetPaths)`                    | ファイル・ディレクトリが存在するか確認する                           |
| `isMatchingPath(targetPath, conditions, options?)`  | パスが条件に一致するか判定する                                       |
| `isIncludedPath(itemPath, options?)`                | パスが対象に含まれるか判定する                                       |

### `generateIndexFiles`

```ts
generateIndexFiles(options?: GenerateIndexFilesOptions): void
```

`srcPath` 配下のディレクトリを再帰的にたどり、各ディレクトリに index ファイルを生成します。\
`include` に一致し `exclude` に一致しないファイル・ディレクトリが export の対象になります。export の形式は `exportAllAs`・`exportDefault`・`exportDefaultAndNamed`・`exportDefaultAs`・`exportTypeAll`・`exportAll` の順に条件を調べ、最初に一致したものを使います。範囲の広い `exportAll` を最後に調べるため、個別に指定した形式が優先されます。どれにも一致しない場合は `export { default as name } from './name';` になります。\
export する対象がないディレクトリには index ファイルを生成しません。

| オプション                 | 型                                | 説明                                                                                                                                                                                               |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `srcPath?`                 | `string`                          | 処理対象のディレクトリ。既定値は `'src'`                                                                                                                                                           |
| `indexFileName?`           | `string`                          | index ファイルの名前。既定値は `'index.ts'`                                                                                                                                                        |
| `ignore?`                  | `IsMatchingPathCondition[]`       | index ファイルを生成しないディレクトリ。一致したディレクトリの配下もたどらない。既定値は `[PRIVATE]`                                                                                               |
| `include?`                 | `IsMatchingPathCondition[]`       | export の対象。既定値は `[TS_JS, HAS_INDEX_DIR]`                                                                                                                                                   |
| `exclude?`                 | `IsMatchingPathCondition[]`       | `include` に一致しても export しないもの。既定値は `[TEST_DIR, TEST_FILE, PRIVATE]`                                                                                                                |
| `includeNamedWithDefault?` | `boolean`                         | 同じ index ファイルにデフォルトエクスポートがあっても名前付きエクスポートを残す。`false` の場合は名前付きエクスポートを除き、`exportDefaultAndNamed` は default export だけにする。既定値は `true` |
| `exportAll?`               | `IsMatchingPathCondition[]`       | `export * from './name';` で export するもの。既定値は `[CONSTANTS, HAS_INDEX_DIR]`                                                                                                                |
| `exportAllAs?`             | `IsMatchingPathCondition[]`       | `export * as name from './name';` で export するもの。既定値は `[]`                                                                                                                                |
| `exportDefault?`           | `IsMatchingPathCondition[]`       | `export { default } from './name';` で export するもの。既定値は `[]`                                                                                                                              |
| `exportDefaultAndNamed?`   | `IsMatchingPathCondition[]`       | `export { default as name, default } from './name';` で export するもの。既定値は `[MAIN_FILE]`                                                                                                    |
| `exportDefaultAs?`         | `IsMatchingPathCondition[]`       | `export { default as name } from './name';` で export するもの                                                                                                                                     |
| `exportTypeAll?`           | `IsMatchingPathCondition[]`       | `export type * from './name';` で export するもの。既定値は `[TYPES]`                                                                                                                              |
| `dryRun?`                  | `boolean`                         | ファイルを書き込まず、生成内容をコンソールに出力する                                                                                                                                               |
| `transform?`               | `(exports: string[]) => string[]` | 出力前に export 文の配列を編集する                                                                                                                                                                 |
| `eol?`                     | `string`                          | 改行コード。既定値は `os.EOL`                                                                                                                                                                      |
| `encoding?`                | `BufferEncoding`                  | 出力のエンコード。既定値は `'utf8'`                                                                                                                                                                |

#### 定数

`@fringeworks/dev/generateIndexFiles/constants` から、オプションに指定できる条件を読み込めます。\
`TS_JS`・`TYPES`・`CONSTANTS`・`TEST_DIR`・`TEST_FILE`・`PRIVATE`・`DEFAULT_EXCLUDE` は、ほかの関数と共通の条件として `@fringeworks/dev/constants` からも読み込めます。

| 定数                               | 説明                                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| `TS_JS`                            | 拡張子が `.ts`・`.tsx`・`.js`・`.jsx` のファイル                 |
| `TYPES`                            | `types.ts`                                                       |
| `CONSTANTS`                        | `constants.ts`・`constants.tsx`                                  |
| `HAS_INDEX_DIR`                    | 直下に index ファイルのあるディレクトリ                          |
| `MAIN_FILE`                        | 拡張子を除いた名前が親ディレクトリ名と同じファイル               |
| `NAMESPACE_DIR`                    | 名前が小文字で始まり、直下に同じ名前のファイルがないディレクトリ |
| `TEST_DIR`                         | `__test__` ディレクトリの配下                                    |
| `TEST_FILE`                        | `*.test.ts`・`*.test.tsx`・`*.test.js`・`*.test.jsx`             |
| `PRIVATE`                          | 名前が `_` で始まるファイル・ディレクトリ                        |
| `DEFAULT_IGNORE`                   | `ignore` の既定値                                                |
| `DEFAULT_INCLUDE`                  | `include` の既定値                                               |
| `DEFAULT_EXCLUDE`                  | `exclude` の既定値                                               |
| `DEFAULT_EXPORT_ALL`               | `exportAll` の既定値                                             |
| `DEFAULT_EXPORT_ALL_AS`            | `exportAllAs` の既定値                                           |
| `DEFAULT_EXPORT_DEFAULT`           | `exportDefault` の既定値                                         |
| `DEFAULT_EXPORT_DEFAULT_AND_NAMED` | `exportDefaultAndNamed` の既定値                                 |
| `DEFAULT_EXPORT_TYPE_ALL`          | `exportTypeAll` の既定値                                         |

既定値に条件を足す場合は、定数と組み合わせて指定します。

```ts
import {
  DEFAULT_EXCLUDE,
  NAMESPACE_DIR,
} from '@fringeworks/dev/generateIndexFiles/constants';

// 特定のディレクトリを export から除く
generateIndexFiles({
  exclude: [...DEFAULT_EXCLUDE, { valueType: 'path', conditions: 'src/css' }],
});

// 小文字で始まるディレクトリを名前空間として export する（export * as name）
generateIndexFiles({ exportAllAs: [NAMESPACE_DIR] });
```

### `createExports`

```ts
createExports(options?: CreateExportsOptions): Record<string, PackageJson.Exports>
```

`srcPath` 配下のモジュールを集め、`package.json` の `exports` に設定する値を返します。\
対象は `index.ts`・`index.tsx` と、`include` に一致するファイルです。拡張子が `.ts`・`.tsx` 以外のファイルと型定義ファイル（`.d.ts`）は対象になりません。

キーは次のように決まります。

| ファイル               | キー              |
| ---------------------- | ----------------- |
| `src/index.ts`         | `.`               |
| `src/foo/index.ts`     | `./foo`           |
| `src/foo/constants.ts` | `./foo/constants` |

値は `target` によって変わります。

- `'src'` — `srcPath` 配下の TypeScript のファイルを指します。ワークスペース内の他のパッケージから、ビルドせずにソースを参照できます。

  ```json
  "./foo": "./src/foo/index.ts"
  ```

- `'dist'` — ビルド後の ESM と CJS のファイルを指します。拡張子は `importExtension` などのオプションで変えられます。

  ```json
  "./foo": {
    "import": { "types": "./foo/index.d.mts", "default": "./foo/index.mjs" },
    "require": { "types": "./foo/index.d.cts", "default": "./foo/index.cjs" }
  }
  ```

| オプション               | 型                                    | 説明                                                                                                       |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `srcPath?`               | `string`                              | 探索するディレクトリ。既定値は `'src'`                                                                     |
| `target?`                | `'src' \| 'dist'`                     | 値が指すファイル。既定値は `'src'`                                                                         |
| `prefix?`                | `string`                              | 値に付ける接頭辞。既定値は `target` が `'src'` なら `'./<srcPath>/'`、`'dist'` なら `'./'`                 |
| `include?`               | `IsMatchingPathCondition[]`           | index ファイルに加えて対象にするファイル                                                                   |
| `exclude?`               | `IsMatchingPathCondition[]`           | 対象から除外するファイル・ディレクトリ。一致したディレクトリの配下もたどらない。既定値は `DEFAULT_EXCLUDE` |
| `extraExports?`          | `Record<string, PackageJson.Exports>` | 生成したものに加えて出力するエントリー。キーが重複した場合はこちらが優先される                             |
| `importExtension?`       | `string \| false`                     | `target` が `'dist'` のときの `import` の拡張子。既定値は `'.mjs'`。`false` で `import` を出力しない       |
| `requireExtension?`      | `string \| false`                     | `target` が `'dist'` のときの `require` の拡張子。既定値は `'.cjs'`。`false` で `require` を出力しない     |
| `importTypesExtension?`  | `string \| false`                     | `import` の型定義の拡張子。既定値は `'.d.mts'`。`false` で `types` を付けず文字列で出力する                |
| `requireTypesExtension?` | `string \| false`                     | `require` の型定義の拡張子。既定値は `'.d.cts'`。`false` で `types` を付けず文字列で出力する               |

`target: 'dist'` は、`@fringeworks/rollup-plugin-dist-package` で公開用の `package.json` を生成する場合に組み合わせて使えます。

```ts
// tsdown.config.ts
import createExports from '@fringeworks/dev/createExports';
import distPackage from '@fringeworks/rollup-plugin-dist-package';

distPackage({
  content: {
    exports: createExports({
      target: 'dist',
      extraExports: { './package.json': './package.json' },
    }),
  },
});
```

#### ワイルドカードとの併用

`target: 'src'` の結果を、手で書いたワイルドカード（`"./*": "./src/*/index.ts"` など）と同じ `exports` に置く場合は、`extraExports` にワイルドカードを渡します。\
Node.js と TypeScript は、ワイルドカードよりも完全一致するキーを優先します。そのため、列挙されたモジュールは列挙された値で、それ以外のパスはワイルドカードで解決されます。\
公開用の `exports` をワイルドカードで書いている場合は、開発用の列挙と公開用のワイルドカードで読み込めるパスがずれないように注意してください。

### `writeExports`

```ts
writeExports(options?: WriteExportsOptions): void
```

`createExports` の結果で `package.json` の `exports` を置き換えます。既存の `exports` は残りません。手で書いたエントリーは `extraExports` に渡します。

| オプション         | 型        | 説明                                                            |
| ------------------ | --------- | --------------------------------------------------------------- |
| `packageJsonPath?` | `string`  | 書き込み先の `package.json` のパス。既定値は `'package.json'`   |
| `dryRun?`          | `boolean` | ファイルを書き込まず、生成した `exports` をコンソールに出力する |

このほか、`createExports` のオプションをすべて指定できます。

### `addJsExtensions`

```ts
addJsExtensions(dir: string): Promise<void>
```

`dir` 配下の `.js`・`.cjs` ファイルで、`./`・`../` から始まる import・require に拡張子を付けます。`.js` ファイルには `.js` を、`.cjs` ファイルには `.cjs` を付け、すでに拡張子があるものはそのままにします。

### `createExternal`

```ts
createExternal(
  options?: CreateExternalOptions,
): ExternalFunction
```

rolldown・rollup などの `external` オプションに渡す関数を作ります。\
作られた関数は `isExternal`・`isInternal` を順に調べ、どちらにも一致しない場合は、解決前のパスが `.`・`/`・`src/` のいずれでも始まらないものを外部モジュールとして扱います。

| オプション    | 型                                            | 説明                     |
| ------------- | --------------------------------------------- | ------------------------ |
| `isExternal?` | `IsMatchingPathCondition<ConditionOptions>[]` | 外部モジュールとする条件 |
| `isInternal?` | `IsMatchingPathCondition<ConditionOptions>[]` | 内部モジュールとする条件 |

条件に関数を指定すると、第2引数に `{ source, importer, isResolved }` が渡されます。

### `createSassClassNameFunction`

```ts
createSassClassNameFunction(
  classNames: Record<string, string>,
  options?: CreateSassClassNameFunctionOptions,
): (args: Value[]) => SassString
```

Sass のカスタム関数を作ります。作られた関数は、第1引数の文字列をキーにして `classNames` から値を取り出し、Sass の文字列として返します。

| 引数         | 型                                   | 説明                         |
| ------------ | ------------------------------------ | ---------------------------- |
| `classNames` | `Record<string, string>`             | キーとクラス名のオブジェクト |
| `options?`   | `CreateSassClassNameFunctionOptions` | 下記のオプション             |

| オプション | 型       | 説明                                   |
| ---------- | -------- | -------------------------------------- |
| `prefix?`  | `string` | キーを引くときに引数の前に付ける文字列 |
| `suffix?`  | `string` | キーを引くときに引数の後に付ける文字列 |

### `generatePublishPackageJson`

```ts
generatePublishPackageJson(
  options?: GeneratePublishPackageJsonOptions,
): Promise<void>
```

`package.json` から `name`・`version`・`keywords`・`repository`・`license`・`author`・`type`・`dependencies` を取り出し、`exports` を加えた公開用の `package.json` を出力します。\
`exports` の既定値は、tsdown が出力する ESM と CJS のファイルを指します。

```json
".": {
  "import": { "types": "./index.d.mts", "default": "./index.mjs" },
  "require": { "types": "./index.d.cts", "default": "./index.cjs" }
}
```

| オプション               | 型                                          | 説明                                                                                                    |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `packageJsonPath?`       | `string`                                    | 元にする `package.json` のパス。既定値は `'./package.json'`                                             |
| `outputPackageJsonPath?` | `string`                                    | 出力先のパス。既定値は `'./dist/package.json'`                                                          |
| `exports?`               | `PackageJson['exports']`                    | `exports` に設定する値。既定値は `.`・`./*`・`./constants`・`./*/constants` の4つで、形式は上記のとおり |
| `transform?`             | `(packageJson: PackageJson) => PackageJson` | 出力前に内容を編集する                                                                                  |
| `jsonReadOptions?`       | `JsonReadOptions`                           | `fs-extra` の `readJSON` に渡すオプション                                                               |
| `jsonWriteOptions?`      | `JsonWriteOptions`                          | `fs-extra` の `writeJSON` に渡すオプション                                                              |

### `editJsonFile`

```ts
editJsonFile(jsonFilePath: string, editor: ((obj: any) => object) | object): void
```

JSON ファイルを読み込んで編集し、インデント2つで書き戻します。ファイルがない場合はエラーメッセージを出力して何もしません。

| 引数           | 型                                 | 説明                                                                         |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `jsonFilePath` | `string`                           | JSON ファイルのパス                                                          |
| `editor`       | `((obj: any) => object) \| object` | 関数の場合は戻り値で置き換える。オブジェクトの場合は元の内容に浅くマージする |

```ts
editJsonFile('package.json', { private: true });
editJsonFile('package.json', ({ devDependencies, ...rest }) => rest);
```

### `installFromLocal`

```ts
installFromLocal(localNodeModulesPath: string, options?: InstallFromLocalOptions): void
```

`package.json` の `dependencies`・`devDependencies` のうち、指定が `localNodeModulesPath` または `file:<localNodeModulesPath>` で始まるパッケージを、`node_modules` にコピーして差し替えます。すでにインストールされているものは削除してからコピーします。

| 引数                   | 型                        | 説明                                           |
| ---------------------- | ------------------------- | ---------------------------------------------- |
| `localNodeModulesPath` | `string`                  | ローカルのパッケージを置いたディレクトリのパス |
| `options?`             | `InstallFromLocalOptions` | 下記のオプション                               |

| オプション         | 型        | 説明                                                          |
| ------------------ | --------- | ------------------------------------------------------------- |
| `packageJsonPath?` | `string`  | `package.json` のパス。既定値は `'./package.json'`            |
| `nodeModulesPath?` | `string`  | コピー先の `node_modules` のパス。既定値は `'./node_modules'` |
| `dryRun?`          | `boolean` | コピーせず、対象のパッケージをコンソールに出力する            |

### `setVersion`

```ts
setVersion(version: string, options?: SetVersionOptions): Promise<void>
```

ワークスペースの `package.json` と、`packagesPath` 直下の各パッケージの `package.json` の `version` を `version` に書き換えます。

| オプション                  | 型       | 説明                                                              |
| --------------------------- | -------- | ----------------------------------------------------------------- |
| `workspacePackageJsonPath?` | `string` | ワークスペースの `package.json` のパス。既定値は `'package.json'` |
| `packagesPath?`             | `string` | パッケージを置いたディレクトリのパス。既定値は `'packages'`       |

### `moveFilesToSubdirs`

```ts
moveFilesToSubdirs(dirPath: string, options?: MoveFilesToSubdirsOptions): void
```

`dirPath` 直下のファイルを、拡張子を除いた同じ名前のサブディレクトリに移動します。`foo.ts` は `foo/foo.ts` になります。

| 引数       | 型                          | 説明                     |
| ---------- | --------------------------- | ------------------------ |
| `dirPath`  | `string`                    | 対象のディレクトリのパス |
| `options?` | `MoveFilesToSubdirsOptions` | 下記のオプション         |

| オプション        | 型                                               | 説明                                                                     |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| `index?`          | `boolean`                                        | 移動先に `export { default } from './name';` だけの index ファイルを作る |
| `process?`        | `(subdirPath: string, fileName: string) => void` | ファイルごとの後処理                                                     |
| `include?`        | `IsMatchingPathCondition[]`                      | 移動する対象                                                             |
| `exclude?`        | `IsMatchingPathCondition[]`                      | 移動する対象から除外するもの                                             |
| `defaultInclude?` | `IsMatchingPathCondition[]`                      | `include` 未指定時に使う条件                                             |
| `defaultExclude?` | `IsMatchingPathCondition[]`                      | `exclude` 未指定時に使う条件                                             |

### `removeFiles`

```ts
removeFiles(source: Pattern | Pattern[], options?: Options): Promise<void>
```

[fast-glob](https://github.com/mrmlnc/fast-glob) のパターンに一致するファイルを削除します。`options` は fast-glob のオプションです。

### `checkExistence`

```ts
checkExistence(...targetPaths: string[]): boolean
```

指定したパスがすべて存在すれば `true` を返します。存在しないパスがあれば、そのパスをエラーとしてコンソールに出力し `false` を返します。

### `isMatchingPath`

```ts
isMatchingPath<O extends ConditionFnOptions = ConditionFnOptions>(
  targetPath: string,
  conditions: IsMatchingPathCondition<O> | IsMatchingPathCondition<O>[] | null | undefined,
  options?: IsMatchingPathOptions<O>,
): boolean
```

`targetPath` が `conditions` のいずれかに一致すれば `true` を返します。`conditions` が `null`・`undefined` の場合は `false` を返します。\
パスは `/` 区切りに正規化してから検査します。

| 引数         | 型                                                                                | 説明                                 |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------ |
| `targetPath` | `string`                                                                          | 検査するパス                         |
| `conditions` | `IsMatchingPathCondition<O> \| IsMatchingPathCondition<O>[] \| null \| undefined` | 一致条件。配列の場合は OR 条件になる |
| `options?`   | `IsMatchingPathOptions<O>`                                                        | 下記のオプション                     |

| オプション          | 型  | 説明                            |
| ------------------- | --- | ------------------------------- |
| `conditionOptions?` | `O` | 条件の関数に第2引数として渡す値 |

条件 `IsMatchingPathCondition` には次の値を指定できます。

| 値                | 説明                                                  |
| ----------------- | ----------------------------------------------------- |
| `string`          | パスにその文字列が含まれていれば一致                  |
| `RegExp`          | パスが正規表現に一致すれば一致                        |
| `ConditionFn`     | `(values, options) => boolean` が `true` を返せば一致 |
| `ConditionConfig` | 下記の設定に従って検査する                            |

| プロパティ   | 型                                                                                       | 説明                                  |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| `valueType?` | `'path' \| 'base' \| 'name' \| 'ext' \| 'dirpath' \| 'dirbase' \| 'dirname' \| 'dirext'` | 検査する値。既定値は `'path'`         |
| `entryType?` | `'dir' \| 'file' \| 'both'`                                                              | 対象の種別。既定値は `'both'`         |
| `conditions` | `string \| RegExp \| ConditionFn<O> \| (string \| RegExp \| ConditionFn<O>)[]`           | 一致条件。配列の場合は AND 条件になる |

`valueType` の各値は次のとおりです。

| 値        | 説明                                       |
| --------- | ------------------------------------------ |
| `path`    | `/` 区切りのパス                           |
| `base`    | 拡張子付きのファイル名・ディレクトリ名     |
| `name`    | 拡張子を除いたファイル名・ディレクトリ名   |
| `ext`     | `.` を含む拡張子。拡張子がない場合は空文字 |
| `dirpath` | 親ディレクトリのパス                       |
| `dirbase` | 拡張子付きの親ディレクトリ名               |
| `dirname` | 拡張子を除いた親ディレクトリ名             |
| `dirext`  | 親ディレクトリの拡張子                     |

```ts
// src/components 配下の .tsx ファイル
isMatchingPath('src/components/Button.tsx', {
  entryType: 'file',
  conditions: ['src/components/', /\.tsx$/],
});
```

### `isIncludedPath`

```ts
isIncludedPath<O extends ConditionFnOptions = ConditionFnOptions>(
  itemPath: string,
  options?: IsIncludedPathOptions<O>,
): boolean
```

`itemPath` が `itemType` の種別で、`include` に一致し、`exclude` に一致しない場合に `true` を返します。`include`・`exclude` を指定しない場合は条件なしとして扱います。

| オプション          | 型                             | 説明                            |
| ------------------- | ------------------------------ | ------------------------------- |
| `itemType?`         | `'file' \| 'dir' \| 'both'`    | 対象の種別。既定値は `'file'`   |
| `include?`          | `IsMatchingPathCondition<O>[]` | 対象とする条件                  |
| `exclude?`          | `IsMatchingPathCondition<O>[]` | 対象から除外する条件            |
| `defaultInclude?`   | `IsMatchingPathCondition<O>[]` | `include` 未指定時に使う条件    |
| `defaultExclude?`   | `IsMatchingPathCondition<O>[]` | `exclude` 未指定時に使う条件    |
| `conditionOptions?` | `O`                            | 条件の関数に第2引数として渡す値 |

### 型

| 型                                   | 説明                                          |
| ------------------------------------ | --------------------------------------------- |
| `GenerateIndexFilesOptions`          | `generateIndexFiles` のオプション             |
| `CreateExportsOptions`               | `createExports` のオプション                  |
| `WriteExportsOptions`                | `writeExports` のオプション                   |
| `CreateExternalOptions`              | `createExternal` のオプション                 |
| `ExternalFunction`                   | `external` オプションに渡す関数               |
| `ConditionOptions`                   | `createExternal` の条件の関数に渡される値     |
| `CreateSassClassNameFunctionOptions` | `createSassClassNameFunction` のオプション    |
| `GeneratePublishPackageJsonOptions`  | `generatePublishPackageJson` のオプション     |
| `InstallFromLocalOptions`            | `installFromLocal` のオプション               |
| `SetVersionOptions`                  | `setVersion` のオプション                     |
| `MoveFilesToSubdirsOptions`          | `moveFilesToSubdirs` のオプション             |
| `IsMatchingPathCondition<O>`         | 一致条件                                      |
| `IsMatchingPathOptions<O>`           | `isMatchingPath` のオプション                 |
| `ConditionConfig<O>`                 | 条件設定                                      |
| `ConditionFn<O>`                     | 条件の関数                                    |
| `ConditionFnOptions`                 | 条件の関数の第2引数                           |
| `ConditionValues`                    | 条件の関数の第1引数。`valueType` の各値を持つ |
| `IsIncludedPathOptions<O>`           | `isIncludedPath` のオプション                 |

型は各関数のサブパス（例: `@fringeworks/dev/generateIndexFiles`）から読み込めます。

## ライセンス

MIT
