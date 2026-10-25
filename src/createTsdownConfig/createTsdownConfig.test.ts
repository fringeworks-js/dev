import { build } from 'tsdown';
import {
  createTempDir,
  exists,
  readFile,
  removeTempDir,
} from '../../test/tempDir';
import createTsdownConfig from './createTsdownConfig';
import type { CreateTsdownConfigOptions } from './types';

/**
 * ビルドするパッケージ
 */
const FILES = {
  'package.json': JSON.stringify({
    name: 'pkg',
    version: '1.0.0',
    type: 'module',
  }),
  'tsconfig.json': JSON.stringify({ compilerOptions: { strict: true } }),
  LICENSE: 'MIT',
  'README.md': '# pkg',
  'README.ja.md': '# pkg',
  'CHANGELOG.md': '# Changelog',
  'src/index.ts': "export * from './foo';\n",
  'src/foo/index.ts':
    "export { default, default as foo } from './foo';\nexport * from './constants';\n",
  'src/foo/foo.ts': 'export default function foo() {\n  return 1;\n}\n',
  'src/foo/constants.ts': "export const FOO = 'foo';\n",
  'src/foo/foo.test.ts': "import foo from './foo';\nfoo();\n",
  'src/foo/styles.css': '.foo {\n  color: red;\n}\n',
  'src/with-css/foo/index.ts':
    "import '../../foo/styles.css';\nexport { default, default as foo } from '../../foo';\n",
};

describe('createTsdownConfig', () => {
  let cwd: string;
  let dir: string;

  beforeEach(() => {
    cwd = process.cwd();
    dir = createTempDir(FILES);
    // createExports は実行時のディレクトリの src を探索するため、パッケージのディレクトリに移動する
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    removeTempDir(dir);
  });

  async function buildPackage(options?: CreateTsdownConfigOptions) {
    await build({
      ...createTsdownConfig(options),
      config: false,
      logLevel: 'silent',
    });
    return JSON.parse(readFile(dir, 'dist/package.json'));
  }

  it('ESM と CJS を出力し、公開用の package.json を作る', async () => {
    const pkg = await buildPackage();
    expect(pkg).toMatchObject({
      name: 'pkg',
      version: '1.0.0',
      main: './index.cjs',
      module: './index.mjs',
      types: './index.d.cts',
      sideEffects: false,
    });
    expect(Object.keys(pkg.exports)).toEqual([
      '.',
      './foo',
      './with-css/foo',
      './package.json',
    ]);
    expect(pkg.exports['./foo']).toEqual({
      import: { types: './foo/index.d.mts', default: './foo/index.mjs' },
      require: { types: './foo/index.d.cts', default: './foo/index.cjs' },
    });
    for (const file of [
      'index.mjs',
      'index.cjs',
      'index.d.mts',
      'index.d.cts',
    ]) {
      expect(exists(dir, `dist/${file}`)).toBe(true);
    }
  });

  it('テストのファイルはビルドしない', async () => {
    await buildPackage();
    expect(exists(dir, 'dist/foo/foo.test.mjs')).toBe(false);
  });

  it('LICENSE・README・CHANGELOG をコピーする', async () => {
    await buildPackage();
    for (const file of [
      'LICENSE',
      'README.md',
      'README.ja.md',
      'CHANGELOG.md',
    ]) {
      expect(exists(dir, `dist/${file}`)).toBe(true);
    }
  });

  it('LICENSE・README・CHANGELOG は存在するものだけをコピーする', async () => {
    removeTempDir(`${dir}/README.ja.md`);
    removeTempDir(`${dir}/CHANGELOG.md`);
    await buildPackage();
    expect(exists(dir, 'dist/README.md')).toBe(true);
    expect(exists(dir, 'dist/README.ja.md')).toBe(false);
    expect(exists(dir, 'dist/CHANGELOG.md')).toBe(false);
  });

  it('CJS でも default export と named export を両方出力する', async () => {
    await buildPackage();
    const code = readFile(dir, 'dist/foo/index.cjs');
    expect(code).toMatch(/exports\.default\b/);
    expect(code).toMatch(/exports\.foo\b/);
  });

  it('exports のオプションを createExports に渡す', async () => {
    const pkg = await buildPackage({
      exports: {
        include: [/\/constants\.ts$/],
        extraExports: { './*.css': './*/styles.css' },
      },
    });
    expect(Object.keys(pkg.exports)).toEqual([
      '.',
      './foo',
      './foo/constants',
      './with-css/foo',
      './package.json',
      './*.css',
    ]);
  });

  it('entry でビルドの対象を置き換える', async () => {
    await buildPackage({ entry: ['src/index.ts'] });
    expect(exists(dir, 'dist/index.mjs')).toBe(true);
    expect(exists(dir, 'dist/with-css/foo/index.mjs')).toBe(false);
  });

  it('copyFiles で出力先にコピーするファイルを加える', async () => {
    await buildPackage({ copyFiles: ['tsconfig.json'] });
    expect(exists(dir, 'dist/tsconfig.json')).toBe(true);
    expect(exists(dir, 'dist/LICENSE')).toBe(true);
  });

  describe('css', () => {
    it('CSS を import したモジュールは、ESM・CJS ともに CSS ファイルを読み込む', async () => {
      const pkg = await buildPackage({ css: true });
      expect(pkg.sideEffects).toEqual(['**/*.css']);
      expect(exists(dir, 'dist/foo/styles.css')).toBe(true);
      expect(readFile(dir, 'dist/with-css/foo/index.mjs')).toContain(
        'import "../../foo/styles.css";',
      );
      expect(readFile(dir, 'dist/with-css/foo/index.cjs')).toContain(
        'require("../../foo/styles.css");',
      );
    });

    it('CSS 以外の require は書き換えない', async () => {
      await buildPackage({ css: true });
      expect(readFile(dir, 'dist/with-css/foo/index.cjs')).toContain(
        'require("../../foo/foo.cjs")',
      );
    });

    it('CSS を import していないモジュールは CSS を読み込まない', async () => {
      await buildPackage({ css: true });
      expect(readFile(dir, 'dist/foo/index.mjs')).not.toContain('.css');
      expect(readFile(dir, 'dist/foo/index.cjs')).not.toContain('.css');
    });
  });
});
