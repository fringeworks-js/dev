# @fringeworks/dev

`@fringeworks/dev` is a library some will find handy, built for developers.\
It collects helpers for package build steps and scripts, such as generating index files, editing `package.json`, and configuring a bundler's `external` option.

**[日本語のREADMEはこちら](./README.ja.md)**

## Installation

```sh
npm install -D @fringeworks/dev
```

It is meant to be used from scripts that run on Node.js and from build tool config files.

## Usage

Each function can be imported from the package root or from a subpath named after the function.

```ts
import { generateIndexFiles } from '@fringeworks/dev';
import generateIndexFiles from '@fringeworks/dev/generateIndexFiles';
```

### Generating index files

Generates an `index.ts` in each directory under `src` that exports the modules inside it.

```ts
// scripts/indexes.ts
import generateIndexFiles from '@fringeworks/dev/generateIndexFiles';

generateIndexFiles();
```

By default, the index of each feature directory exports its main module both as the default export and as a named export, and the indexes of categories and the root pass everything on with `export *`. This file structure

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

produces the following index files. Directories and files whose name starts with `_` and test files are left out.

```ts
// src/number/keepInRange/index.ts
export * from './constants';
export { default, default as keepInRange } from './keepInRange';
export type * from './types';

// src/number/index.ts
export * from './keepInRange';

// src/index.ts
export * from './number';
```

Users can import by the same name from any path.

```ts
import { keepInRange, RangeMode } from 'my-package';
import { keepInRange } from 'my-package/number';
import keepInRange from 'my-package/number/keepInRange';
```

Because default and named exports come from the same file, set the build output option `exports: 'named'` when you also output CJS, to suppress the mixed-exports warning.

### The bundler's `external` option

Creates a function that treats every import other than relative paths, absolute paths, and paths under `src/` as external. It can be passed to `external` in rolldown, rollup, tsdown, and so on.

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

### Using class names defined in TypeScript from Sass

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

### Shared tsconfig

The TypeScript settings shared by the `@fringeworks` packages are included as `tsconfig.base.json`. Load it with `extends` and add only the differences for each package.

```json
{
  "extends": "@fringeworks/dev/tsconfig.base.json",
  "include": ["src", "globals.d.ts"]
}
```

The settings assume that a bundler (tsdown and so on) builds the package and tsc only type-checks it (`noEmit: true`). In addition to `strict`, they enable `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns` and more. Settings with paths such as `include` are not included, because they cannot be resolved relative to the package that loads them.

### Shared ESLint config

Creates the ESLint config (flat config) shared by the `@fringeworks` packages. Install `eslint` and `typescript` in the package that uses it.

```js
// eslint.config.js
import createESLintConfig from '@fringeworks/dev/createESLintConfig';

export default createESLintConfig(import.meta.dirname);
```

For React packages, specify `react: true`. Add package-specific settings after it with `defineConfig`.

```js
// eslint.config.js
import createESLintConfig from '@fringeworks/dev/createESLintConfig';
import { defineConfig } from 'eslint/config';
import storybook from 'eslint-plugin-storybook';

export default defineConfig([
  createESLintConfig(import.meta.dirname, { react: true }),
  storybook.configs['flat/recommended'],
]);
```

### Shared Prettier config

Creates the Prettier config shared by the `@fringeworks` packages. Install `prettier` and `typescript` in the package that uses it. The plugins (`prettier-plugin-organize-imports` and `prettier-plugin-packagejson`) are bundled, so you don't need to install them.

```ts
// prettier.config.ts
import createPrettierConfig from '@fringeworks/dev/createPrettierConfig';

export default createPrettierConfig();
```

Put the config that also removes unused imports in a separate file to pass with `--config`.

```ts
// prettier.tidy.config.ts
import createPrettierConfig from '@fringeworks/dev/createPrettierConfig';

export default createPrettierConfig({ removeUnusedImports: true });
```

### Shared tsdown config

Creates the tsdown config shared by the `@fringeworks` packages. It outputs the files under `src` as ESM and CJS, and generates a `package.json` for publishing under `dist`. Install `tsdown` in the package that uses it.

```ts
// tsdown.config.ts
import createTsdownConfig from '@fringeworks/dev/createTsdownConfig';

export default createTsdownConfig();
```

For packages with CSS, specify `css: true`. The options in `exports` are passed to `createExports`.

```ts
// tsdown.config.ts
import createTsdownConfig from '@fringeworks/dev/createTsdownConfig';

export default createTsdownConfig({
  css: true,
  exports: {
    extraExports: { './*.css': './*/styles.css' },
  },
});
```

Add settings that have no option to the returned config.

```ts
// tsdown.config.ts
import createTsdownConfig from '@fringeworks/dev/createTsdownConfig';
import { defineConfig } from 'tsdown';

const config = createTsdownConfig();

export default defineConfig({
  ...config,
  outputOptions: { ...config.outputOptions, banner: '/* banner */' },
});
```

## API

| Function                                            | Description                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `generateIndexFiles(options?)`                      | Generates index files under a directory                                       |
| `createExports(options?)`                           | Creates the value for `exports` from the modules under a directory            |
| `writeExports(options?)`                            | Writes the result of `createExports` to `exports` in `package.json`           |
| `addJsExtensions(dir)`                              | Adds extensions to relative imports in built JavaScript files                 |
| `createExternal(options?)`                          | Creates a function for a bundler's `external` option                          |
| `createSassClassNameFunction(classNames, options?)` | Creates a Sass custom function that returns class names defined in TypeScript |
| `createESLintConfig(rootDir, options?)`             | Creates the shared ESLint config                                              |
| `createPrettierConfig(options?)`                    | Creates the shared Prettier config                                            |
| `createTsdownConfig(options?)`                      | Creates the shared tsdown config                                              |
| `generatePublishPackageJson(options?)`              | Generates a `package.json` for publishing                                     |
| `editJsonFile(jsonFilePath, editor)`                | Edits a JSON file                                                             |
| `installFromLocal(localNodeModulesPath, options?)`  | Copies locally placed packages into `node_modules`                            |
| `setVersion(version, options?)`                     | Writes a version to the workspace's and each package's `package.json`         |
| `moveFilesToSubdirs(dirPath, options?)`             | Moves files in a directory into subdirectories of the same name               |
| `removeFiles(source, options?)`                     | Removes files that match glob patterns                                        |
| `checkExistence(...targetPaths)`                    | Checks that files or directories exist                                        |
| `isMatchingPath(targetPath, conditions, options?)`  | Tests whether a path matches conditions                                       |
| `isIncludedPath(itemPath, options?)`                | Tests whether a path is included in the targets                               |

### `generateIndexFiles`

```ts
generateIndexFiles(options?: GenerateIndexFilesOptions): string[]
```

Walks the directories under `srcPath` recursively and generates an index file in each of them.\
Files and directories that match `include` and do not match `exclude` are exported. The export form is decided by checking `exportAllAs`, `exportDefault`, `exportDefaultAndNamed`, `exportDefaultAs`, `exportTypeAll`, and `exportAll` in that order and using the first match. The broad `exportAll` is checked last so that more specific forms take precedence. If none matches, `export { default as name } from './name';` is used.\
No index file is generated in a directory that has nothing to export. If an old index file is left in such a directory, it is kept with a warning and is not exported from the parent's index file either.\
Returns the absolute paths of the generated index files. Throws if `srcPath` is not a directory, or if a file or directory name is not a valid identifier (such as `my-file.ts`) in a form that exports it by name.

| Option                   | Type                              | Description                                                                                                                                       |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `srcPath?`               | `string`                          | The directory to process. Defaults to `'src'`                                                                                                     |
| `indexFileName?`         | `string`                          | The name of index files. Defaults to `'index.ts'`                                                                                                 |
| `ignore?`                | `IsMatchingPathCondition[]`       | Directories in which no index file is generated. Their contents are not walked either. Defaults to `[PRIVATE]`                                    |
| `include?`               | `IsMatchingPathCondition[]`       | What to export. Defaults to `[TS_JS, HAS_INDEX_DIR]`                                                                                              |
| `exclude?`               | `IsMatchingPathCondition[]`       | What not to export even if it matches `include`. Defaults to `[TEST_DIR, TEST_FILE, PRIVATE]`                                                     |
| `omitNamedWithDefault?`  | `boolean`                         | Drops named exports when the same index file has a default export, and makes `exportDefaultAndNamed` export only the default. Defaults to `false` |
| `exportAll?`             | `IsMatchingPathCondition[]`       | What to export as `export * from './name';`. Defaults to `[CONSTANTS, HAS_INDEX_DIR]`                                                             |
| `exportAllAs?`           | `IsMatchingPathCondition[]`       | What to export as `export * as name from './name';`. Defaults to `[]`                                                                             |
| `exportDefault?`         | `IsMatchingPathCondition[]`       | What to export as `export { default } from './name';`. Defaults to `[]`                                                                           |
| `exportDefaultAndNamed?` | `IsMatchingPathCondition[]`       | What to export as `export { default, default as name } from './name';`. Defaults to `[MAIN_FILE]`                                                 |
| `exportDefaultAs?`       | `IsMatchingPathCondition[]`       | What to export as `export { default as name } from './name';`                                                                                     |
| `exportTypeAll?`         | `IsMatchingPathCondition[]`       | What to export as `export type * from './name';`. Defaults to `[TYPES]`                                                                           |
| `dryRun?`                | `boolean`                         | Prints the generated content to the console instead of writing files                                                                              |
| `transform?`             | `(exports: string[]) => string[]` | Edits the array of export statements before output                                                                                                |
| `eol?`                   | `string`                          | The line ending. Defaults to `'\n'`                                                                                                               |
| `encoding?`              | `BufferEncoding`                  | The output encoding. Defaults to `'utf8'`                                                                                                         |

#### Constants

Conditions for the options can be imported from `@fringeworks/dev/generateIndexFiles` (or the package root).\
`TS_JS`, `TYPES`, `CONSTANTS`, `TEST_DIR`, `TEST_FILE`, `PRIVATE`, and `DEFAULT_EXCLUDE` are shared with other functions such as `createExports`.

| Constant                           | Description                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TS_JS`                            | Files with the extension `.ts`, `.tsx`, `.js`, or `.jsx` (excluding `.d.ts`)                                                |
| `TYPES`                            | `types.ts`                                                                                                                  |
| `CONSTANTS`                        | `constants.ts` and `constants.tsx`                                                                                          |
| `HAS_INDEX_DIR`                    | Directories for which an index file was generated. Directories skipped by `ignore` match if they already have an index file |
| `MAIN_FILE`                        | Files whose name without the extension equals the parent directory's name                                                   |
| `NAMESPACE_DIR`                    | Directories whose name starts with a lowercase letter and that directly contain no file of the same name                    |
| `TEST_DIR`                         | Anything under a `__test__` directory                                                                                       |
| `TEST_FILE`                        | `*.test.ts`, `*.test.tsx`, `*.test.js`, and `*.test.jsx`                                                                    |
| `PRIVATE`                          | Files and directories whose name starts with `_`                                                                            |
| `DEFAULT_IGNORE`                   | The default of `ignore`                                                                                                     |
| `DEFAULT_INCLUDE`                  | The default of `include`                                                                                                    |
| `DEFAULT_EXCLUDE`                  | The default of `exclude`                                                                                                    |
| `DEFAULT_EXPORT_ALL`               | The default of `exportAll`                                                                                                  |
| `DEFAULT_EXPORT_ALL_AS`            | The default of `exportAllAs`                                                                                                |
| `DEFAULT_EXPORT_DEFAULT`           | The default of `exportDefault`                                                                                              |
| `DEFAULT_EXPORT_DEFAULT_AND_NAMED` | The default of `exportDefaultAndNamed`                                                                                      |
| `DEFAULT_EXPORT_TYPE_ALL`          | The default of `exportTypeAll`                                                                                              |

To add a condition to a default, combine it with the constants.

```ts
import {
  DEFAULT_EXCLUDE,
  NAMESPACE_DIR,
} from '@fringeworks/dev/generateIndexFiles';

// Leave a directory out of the exports
generateIndexFiles({
  exclude: [...DEFAULT_EXCLUDE, { valueType: 'path', conditions: 'src/css' }],
});

// Export lowercase directories as namespaces (export * as name)
generateIndexFiles({ exportAllAs: [NAMESPACE_DIR] });
```

### `createExports`

```ts
createExports(options?: CreateExportsOptions): Record<string, PackageJson.Exports>
```

Collects the modules under `srcPath` and returns a value for `exports` in `package.json`.\
The targets are `index.ts`, `index.tsx`, and files that match `include`. Files with an extension other than `.ts` or `.tsx`, and type declaration files (`.d.ts`), are not targets. Throws if `srcPath` is not a directory.

Keys are decided as follows.

| File                   | Key               |
| ---------------------- | ----------------- |
| `src/index.ts`         | `.`               |
| `src/foo/index.ts`     | `./foo`           |
| `src/foo/constants.ts` | `./foo/constants` |

Values depend on `target`.

- `'src'` — Points at the TypeScript files under `srcPath`. Other packages in the workspace can refer to the source without building.

  ```json
  "./foo": "./src/foo/index.ts"
  ```

- `'dist'` — Points at the built ESM and CJS files. The extensions can be changed with options such as `importExtension`.

  ```json
  "./foo": {
    "import": { "types": "./foo/index.d.mts", "default": "./foo/index.mjs" },
    "require": { "types": "./foo/index.d.cts", "default": "./foo/index.cjs" }
  }
  ```

| Option                   | Type                                  | Description                                                                                                            |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `srcPath?`               | `string`                              | The directory to search. Defaults to `'src'`                                                                           |
| `target?`                | `'src' \| 'dist'`                     | The files the values point at. Defaults to `'src'`                                                                     |
| `prefix?`                | `string`                              | A prefix for the values. Defaults to `'./<srcPath>/'` when `target` is `'src'`, and `'./'` when it is `'dist'`         |
| `include?`               | `IsMatchingPathCondition[]`           | Files to target in addition to index files                                                                             |
| `exclude?`               | `IsMatchingPathCondition[]`           | Files and directories to exclude. The contents of a matching directory are not walked. Defaults to `DEFAULT_EXCLUDE`   |
| `extraExports?`          | `Record<string, PackageJson.Exports>` | Entries output in addition to the generated ones. These win when a key is duplicated                                   |
| `importExtension?`       | `string \| false`                     | The extension for `import` when `target` is `'dist'`. Defaults to `'.mjs'`. `false` omits `import`                     |
| `requireExtension?`      | `string \| false`                     | The extension for `require` when `target` is `'dist'`. Defaults to `'.cjs'`. `false` omits `require`                   |
| `importTypesExtension?`  | `string \| false`                     | The extension of the type declarations for `import`. Defaults to `'.d.mts'`. `false` outputs a string without `types`  |
| `requireTypesExtension?` | `string \| false`                     | The extension of the type declarations for `require`. Defaults to `'.d.cts'`. `false` outputs a string without `types` |

`target: 'dist'` can be combined with `@fringeworks/rollup-plugin-dist-package` to generate the `package.json` for publishing.

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

#### Using with wildcards

To put the result of `target: 'src'` in the same `exports` as hand-written wildcards (such as `"./*": "./src/*/index.ts"`), pass the wildcards to `extraExports`.\
Node.js and TypeScript prefer keys that match exactly over wildcards. So the listed modules resolve to the listed values, and other paths resolve through the wildcards.\
If the `exports` for publishing is written with wildcards, take care that the paths importable through the listed entries in development and through the wildcards after publishing do not drift apart.

### `writeExports`

```ts
writeExports(options?: WriteExportsOptions): void
```

Replaces `exports` in `package.json` with the result of `createExports`. The existing `exports` is not kept. Pass hand-written entries to `extraExports`. Throws if `package.json` does not exist.

| Option             | Type      | Description                                                               |
| ------------------ | --------- | ------------------------------------------------------------------------- |
| `packageJsonPath?` | `string`  | The path of the `package.json` to write to. Defaults to `'package.json'`  |
| `dryRun?`          | `boolean` | Prints the generated `exports` to the console instead of writing the file |

All options of `createExports` can also be given.

### `addJsExtensions`

```ts
addJsExtensions(dir: string): void
```

Adds extensions to imports, exports, dynamic imports, and requires starting with `.` or `..` in the `.js`, `.mjs`, and `.cjs` files under `dir`. The extension added is the same as that of the file being rewritten.\
What a specifier points at is decided by looking at the actual files, in the order below. If none exists, the specifier is left as is with a warning. Throws if `dir` is not a directory.

1. A file exists at the specifier as is (`./a.js`, `./data.json`, and so on) — left as is
2. `<specifier><extension>` exists — the extension is added (`./a` → `./a.js`)
3. `<specifier>/index<extension>` exists — `/index` and the extension are added (`./dir` → `./dir/index.js`)

### `createExternal`

```ts
createExternal(
  options?: CreateExternalOptions,
): ExternalFunction
```

Creates a function for the `external` option of rolldown, rollup, and so on.\
The function checks `isExternal` and then `isInternal`. If neither matches, it treats an unresolved path as external unless it starts with one of the following.

- `.` (relative paths)
- `/`, `\`, `C:\`, `C:/` (absolute paths)
- `\0` (virtual modules of plugins)
- `#` (subpath imports)
- `<srcPath>/`

If you use aliases from `paths` in tsconfig (such as `@/`), add them to `isInternal`.

| Option        | Type                                          | Description                                                    |
| ------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `srcPath?`    | `string`                                      | The directory treated as internal modules. Defaults to `'src'` |
| `isExternal?` | `IsMatchingPathCondition<ConditionOptions>[]` | Conditions for external modules                                |
| `isInternal?` | `IsMatchingPathCondition<ConditionOptions>[]` | Conditions for internal modules                                |

A condition given as a function receives `{ source, importer, isResolved }` as its second argument.

### `createSassClassNameFunction`

```ts
createSassClassNameFunction(
  classNames: Record<string, string>,
  options?: CreateSassClassNameFunctionOptions,
): (args: Value[]) => SassString
```

Creates a Sass custom function. The function looks up `classNames` with its first argument as the key and returns the value as a Sass string.\
If the argument is not a string, or no class name is defined for the key, it raises a Sass error.

| Parameter    | Type                                 | Description                       |
| ------------ | ------------------------------------ | --------------------------------- |
| `classNames` | `Record<string, string>`             | An object of keys and class names |
| `options?`   | `CreateSassClassNameFunctionOptions` | The options below                 |

| Option    | Type     | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `prefix?` | `string` | A string put before the argument when looking up the key |
| `suffix?` | `string` | A string put after the argument when looking up the key  |

### `createESLintConfig`

```ts
createESLintConfig(
  rootDir: string,
  options?: CreateESLintConfigOptions,
): Linter.Config[]
```

Creates the ESLint config (flat config) shared by the `@fringeworks` packages.

- Ignores `dist`, `coverage`, `storybook-static` and `test-results`
- Applies the recommended configs of `@eslint/js` and `typescript-eslint` to every `.ts` and `.tsx` file in the package
- Reports `any` (`@typescript-eslint/no-explicit-any`) as an error, except in test and story files (`*.test.*`, `*.test-d.*` and files under `e2e/` and `stories/`)
- Reports unused variables (`@typescript-eslint/no-unused-vars`) as an error. Names starting with `_` and names destructured to take the rest with a rest element are allowed

It contains no rules that need type information, so it can also lint files that are not in `include` of tsconfig.

| Parameter  | Type                        | Description                                                                                                 |
| ---------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `rootDir`  | `string`                    | The root directory of the package (`import.meta.dirname`). Passed to `tsconfigRootDir` of typescript-eslint |
| `options?` | `CreateESLintConfigOptions` | The options below                                                                                           |

| Option   | Type      | Description                                                                     |
| -------- | --------- | ------------------------------------------------------------------------------- |
| `react?` | `boolean` | Adds the recommended config of `eslint-plugin-react-hooks`. Defaults to `false` |

`rootDir` prevents the error that typescript-eslint raises when it cannot infer `tsconfigRootDir` because the configs of multiple packages are loaded in the same process (for example, when a multi-root workspace is opened in VS Code).

### `createPrettierConfig`

```ts
createPrettierConfig(
  options?: CreatePrettierConfigOptions,
): Config
```

Creates the Prettier config shared by the `@fringeworks` packages.

| Setting          | Value                                                             |
| ---------------- | ----------------------------------------------------------------- |
| `arrowParens`    | `'always'`                                                        |
| `semi`           | `true`                                                            |
| `useTabs`        | `false`                                                           |
| `tabWidth`       | `2`                                                               |
| `bracketSpacing` | `true`                                                            |
| `singleQuote`    | `true`                                                            |
| `printWidth`     | `80`                                                              |
| `trailingComma`  | `'all'`                                                           |
| `endOfLine`      | `'auto'`                                                          |
| `plugins`        | `prettier-plugin-organize-imports`, `prettier-plugin-packagejson` |

The plugins are passed as loaded modules, so you don't need to install them in the package that uses the config.

| Option                 | Type      | Description                                                         |
| ---------------------- | --------- | ------------------------------------------------------------------- |
| `removeUnusedImports?` | `boolean` | Removes unused imports when organizing imports. Defaults to `false` |

### `createTsdownConfig`

```ts
createTsdownConfig(
  options?: CreateTsdownConfigOptions,
): UserConfig
```

Creates the tsdown config shared by the `@fringeworks` packages.

- Outputs each module of the `.ts` and `.tsx` files under `src` (except `*.test.*`, `*.test-d.*`, `*.spec.*` and `*.d.ts`) as ESM (`.mjs`), CJS (`.cjs`) and type declarations
- Outputs with `exports: 'named'` so that CJS can also use both a default export and named exports
- Treats imports outside `src` as external modules with `createExternal()`
- Generates `dist/package.json` with `@fringeworks/rollup-plugin-dist-package`. Its `exports` is the result of `createExports` plus `./package.json`
- Copies `LICENSE`, `README.md` and `README.ja.md` to `dist` if they exist

Run it in the root of the package, because it scans `src` to create the `exports`.

| Option       | Type                                   | Description                                                                                                     |
| ------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `css?`       | `boolean`                              | Enables the settings for packages with CSS (below). Defaults to `false`                                         |
| `exports?`   | `Omit<CreateExportsOptions, 'target'>` | Options passed to `createExports`. `target` is always `'dist'`, and `./package.json` is added to `extraExports` |
| `entry?`     | `string[]`                             | Replaces the files to build                                                                                     |
| `copyFiles?` | `string[]`                             | Files to copy to `dist` in addition to `LICENSE`, `README.md` and `README.ja.md`                                |

With `css: true`:

- Keeps the imports of CSS files in the output of modules that import CSS (`css.inject`)
- Sets `sideEffects` in `package.json` to `['**/*.css']`
- Changes the extension of `require` calls that point to CSS to `.css` in the CJS output, because `css.inject` only rewrites ESM import statements and CJS keeps requiring a `.cjs` file that is not output

To handle CSS, install `@tsdown/css` (and `sass` to use Sass) in the package that uses it.

### `generatePublishPackageJson`

```ts
generatePublishPackageJson(
  options?: GeneratePublishPackageJsonOptions,
): void
```

Takes the following fields from `package.json`, adds `exports`, and writes a `package.json` for publishing. The fields follow the defaults of `@fringeworks/rollup-plugin-dist-package`. The output directory is created if it does not exist. Throws if `packageJsonPath` does not exist.

- `name`, `version`, `description`, `keywords`, `repository`, `bugs`, `homepage`, `author`, `contributors`, `license`, `type`, `engines`, `sideEffects`
- `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies`

The default `exports` points at the ESM and CJS files that tsdown outputs.

```json
".": {
  "import": { "types": "./index.d.mts", "default": "./index.mjs" },
  "require": { "types": "./index.d.cts", "default": "./index.cjs" }
}
```

| Option                   | Type                                        | Description                                                                      |
| ------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------- |
| `packageJsonPath?`       | `string`                                    | The path of the source `package.json`. Defaults to `'./package.json'`            |
| `outputPackageJsonPath?` | `string`                                    | The output path. Defaults to `'./dist/package.json'`                             |
| `exports?`               | `PackageJson['exports']`                    | The value for `exports`. Defaults to entries for `.` and `./*` in the form above |
| `transform?`             | `(packageJson: PackageJson) => PackageJson` | Edits the content before output                                                  |
| `jsonReadOptions?`       | `JsonReadOptions`                           | Options passed to `readJSON` of `fs-extra`                                       |
| `jsonWriteOptions?`      | `JsonOutputOptions`                         | Options passed to `outputJSON` of `fs-extra`. Defaults to `{ spaces: 2 }`        |

### `editJsonFile`

```ts
editJsonFile(jsonFilePath: string, editor: ((obj: any) => object) | object): void
```

Reads a JSON file, edits it, and writes it back with an indent of 2. Throws if the file does not exist.

| Parameter      | Type                               | Description                                                                                           |
| -------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `jsonFilePath` | `string`                           | The path of the JSON file                                                                             |
| `editor`       | `((obj: any) => object) \| object` | A function replaces the content with its return value. An object is shallowly merged into the content |

```ts
editJsonFile('package.json', { private: true });
editJsonFile('package.json', ({ devDependencies, ...rest }) => rest);
```

### `installFromLocal`

```ts
installFromLocal(localNodeModulesPath: string, options?: InstallFromLocalOptions): void
```

Of the `dependencies` and `devDependencies` in `package.json`, copies the packages specified by a path (optionally with `file:`) that points under `localNodeModulesPath` into `node_modules`, replacing them. Packages already installed are removed before copying.\
As with npm, the paths of dependencies are resolved against the directory containing `package.json`. Throws if `localNodeModulesPath` or `package.json` does not exist.

| Parameter              | Type                      | Description                                          |
| ---------------------- | ------------------------- | ---------------------------------------------------- |
| `localNodeModulesPath` | `string`                  | The path of the directory holding the local packages |
| `options?`             | `InstallFromLocalOptions` | The options below                                    |

| Option             | Type      | Description                                                       |
| ------------------ | --------- | ----------------------------------------------------------------- |
| `packageJsonPath?` | `string`  | The path of `package.json`. Defaults to `'./package.json'`        |
| `nodeModulesPath?` | `string`  | The `node_modules` to copy into. Defaults to `'./node_modules'`   |
| `dryRun?`          | `boolean` | Prints the target packages to the console instead of copying them |

### `setVersion`

```ts
setVersion(version: string, options?: SetVersionOptions): void
```

Sets `version` in the workspace's `package.json` and in the `package.json` of each package directly under `packagesPath`. Throws if the workspace's `package.json` or `packagesPath` does not exist.

| Option                      | Type     | Description                                                              |
| --------------------------- | -------- | ------------------------------------------------------------------------ |
| `workspacePackageJsonPath?` | `string` | The path of the workspace's `package.json`. Defaults to `'package.json'` |
| `packagesPath?`             | `string` | The path of the directory holding the packages. Defaults to `'packages'` |

### `moveFilesToSubdirs`

```ts
moveFilesToSubdirs(dirPath: string, options?: MoveFilesToSubdirsOptions): void
```

Moves the files directly under `dirPath` into subdirectories named after the file without its extension. `foo.ts` becomes `foo/foo.ts`.\
Throws if `dirPath` is not a directory, or if `index` is given and a file name is not a valid identifier.

| Parameter  | Type                        | Description                      |
| ---------- | --------------------------- | -------------------------------- |
| `dirPath`  | `string`                    | The path of the target directory |
| `options?` | `MoveFilesToSubdirsOptions` | The options below                |

| Option              | Type                                             | Description                                                                                                                                |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `index?`            | `boolean`                                        | Creates an index file in each subdirectory in the same form as `generateIndexFiles` (`export { default, default as name } from './name';`) |
| `afterMove?`        | `(subdirPath: string, fileName: string) => void` | Called after each file is moved                                                                                                            |
| `include?`          | `IsMatchingPathCondition[]`                      | What to move                                                                                                                               |
| `exclude?`          | `IsMatchingPathCondition[]`                      | What not to move                                                                                                                           |
| `defaultInclude?`   | `IsMatchingPathCondition[]`                      | Conditions used when `include` is not given                                                                                                |
| `defaultExclude?`   | `IsMatchingPathCondition[]`                      | Conditions used when `exclude` is not given                                                                                                |
| `conditionOptions?` | `ConditionFnOptions`                             | A value passed to condition functions as the second argument                                                                               |

### `removeFiles`

```ts
removeFiles(source: Pattern | Pattern[], options?: RemoveFilesOptions): void
```

Removes files that match [fast-glob](https://github.com/mrmlnc/fast-glob) patterns. `options` are fast-glob options. `absolute` is always treated as `true` so that the right files are removed even when `cwd` is given.

### `checkExistence`

```ts
checkExistence(...targetPaths: string[]): boolean
```

Returns `true` if all given paths exist. Otherwise, prints the missing paths to the console as errors and returns `false`.

### `isMatchingPath`

```ts
isMatchingPath<O extends ConditionFnOptions = ConditionFnOptions>(
  targetPath: string,
  conditions: IsMatchingPathCondition<O> | IsMatchingPathCondition<O>[] | null | undefined,
  options?: IsMatchingPathOptions<O>,
): boolean
```

Returns `true` if `targetPath` matches any of `conditions`. Returns `false` if `conditions` is `null` or `undefined`.\
The path is normalized to `/` separators (Windows `\` separators included) before testing.

| Parameter    | Type                                                                              | Description                           |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------- |
| `targetPath` | `string`                                                                          | The path to test                      |
| `conditions` | `IsMatchingPathCondition<O> \| IsMatchingPathCondition<O>[] \| null \| undefined` | Conditions. An array is treated as OR |
| `options?`   | `IsMatchingPathOptions<O>`                                                        | The options below                     |

| Option              | Type | Description                                                  |
| ------------------- | ---- | ------------------------------------------------------------ |
| `conditionOptions?` | `O`  | A value passed to condition functions as the second argument |

A condition `IsMatchingPathCondition` can be one of the following.

| Value             | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `string`          | Matches if the path contains the string                  |
| `RegExp`          | Matches if the path matches the regular expression       |
| `ConditionFn`     | Matches if `(values, options) => boolean` returns `true` |
| `ConditionConfig` | Tests according to the settings below                    |

| Property     | Type                                                                                     | Description                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `valueType?` | `'path' \| 'base' \| 'name' \| 'ext' \| 'dirpath' \| 'dirbase' \| 'dirname' \| 'dirext'` | The value to test. Defaults to `'path'`                                                                                                          |
| `entryType?` | `EntryType`                                                                              | The kind of entry. Defaults to `'both'`. With `'dir'` or `'file'`, a path that does not exist does not match (`'both'` does not check existence) |
| `conditions` | `string \| RegExp \| ConditionFn<O> \| (string \| RegExp \| ConditionFn<O>)[]`           | Conditions. An array is treated as AND                                                                                                           |

The values of `valueType` are as follows.

| Value     | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `path`    | The `/`-separated path                                        |
| `base`    | The file or directory name with its extension                 |
| `name`    | The file or directory name without its extension              |
| `ext`     | The extension including `.`. An empty string if there is none |
| `dirpath` | The path of the parent directory                              |
| `dirbase` | The parent directory's name with its extension                |
| `dirname` | The parent directory's name without its extension             |
| `dirext`  | The parent directory's extension                              |

```ts
// .tsx files under src/components
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

Returns `true` if `itemPath` is of the kind `entryType`, matches `include`, and does not match `exclude`. When `include` or `exclude` is not given, it is treated as having no condition. Returns `false` for a path that does not exist.

| Option              | Type                           | Description                                                  |
| ------------------- | ------------------------------ | ------------------------------------------------------------ |
| `entryType?`        | `EntryType`                    | The kind of entry. Defaults to `'file'`                      |
| `include?`          | `IsMatchingPathCondition<O>[]` | Conditions for targets                                       |
| `exclude?`          | `IsMatchingPathCondition<O>[]` | Conditions for excluding from targets                        |
| `defaultInclude?`   | `IsMatchingPathCondition<O>[]` | Conditions used when `include` is not given                  |
| `defaultExclude?`   | `IsMatchingPathCondition<O>[]` | Conditions used when `exclude` is not given                  |
| `conditionOptions?` | `O`                            | A value passed to condition functions as the second argument |

### Types

| Type                                 | Description                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `GenerateIndexFilesOptions`          | Options of `generateIndexFiles`                                           |
| `CreateExportsOptions`               | Options of `createExports`                                                |
| `WriteExportsOptions`                | Options of `writeExports`                                                 |
| `CreateExternalOptions`              | Options of `createExternal`                                               |
| `ExternalFunction`                   | A function for the `external` option                                      |
| `ConditionOptions`                   | The value passed to condition functions of `createExternal`               |
| `CreateSassClassNameFunctionOptions` | Options of `createSassClassNameFunction`                                  |
| `CreateESLintConfigOptions`          | Options of `createESLintConfig`                                           |
| `CreatePrettierConfigOptions`        | Options of `createPrettierConfig`                                         |
| `CreateTsdownConfigOptions`          | Options of `createTsdownConfig`                                           |
| `GeneratePublishPackageJsonOptions`  | Options of `generatePublishPackageJson`                                   |
| `InstallFromLocalOptions`            | Options of `installFromLocal`                                             |
| `SetVersionOptions`                  | Options of `setVersion`                                                   |
| `MoveFilesToSubdirsOptions`          | Options of `moveFilesToSubdirs`                                           |
| `RemoveFilesOptions`                 | Options of `removeFiles` (fast-glob options)                              |
| `IsMatchingPathCondition<O>`         | A condition                                                               |
| `IsMatchingPathOptions<O>`           | Options of `isMatchingPath`                                               |
| `ConditionConfig<O>`                 | Condition settings                                                        |
| `ConditionFn<O>`                     | A condition function                                                      |
| `ConditionFnOptions`                 | The second argument of condition functions                                |
| `ConditionValues`                    | The first argument of condition functions, holding each `valueType` value |
| `IsIncludedPathOptions<O>`           | Options of `isIncludedPath`                                               |
| `EntryType`                          | The kind of entry (`'dir' \| 'file' \| 'both'`)                           |

Types can be imported from each function's subpath (e.g. `@fringeworks/dev/generateIndexFiles`).

## License

MIT
