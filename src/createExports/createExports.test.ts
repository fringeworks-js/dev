import path from 'path';
import { createTempDir, removeTempDir } from '../../test/tempDir';
import { CONSTANTS } from '../constants';
import createExports from './createExports';

describe('createExports', () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir({
      'index.ts': '',
      'globals.d.ts': '',
      'foo/index.ts': '',
      'foo/foo.ts': '',
      'foo/constants.ts': '',
      'foo/foo.test.ts': '',
      'bar/index.tsx': '',
      'bar/types.d.ts': '',
      '_internal/index.ts': '',
      '__test__/sub/index.ts': '',
      'css/style.css': '',
    });
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  it('indexファイルをsrcのファイルを指すexportsにする', () => {
    expect(createExports({ srcPath: dir, prefix: './src/' })).toEqual({
      '.': './src/index.ts',
      './bar': './src/bar/index.tsx',
      './foo': './src/foo/index.ts',
    });
  });

  it('includeで対象のファイルを追加する（型定義ファイルは除く）', () => {
    expect(
      createExports({
        srcPath: dir,
        prefix: './src/',
        include: [CONSTANTS, /\.d\.ts$/],
      }),
    ).toEqual({
      '.': './src/index.ts',
      './bar': './src/bar/index.tsx',
      './foo': './src/foo/index.ts',
      './foo/constants': './src/foo/constants.ts',
    });
  });

  it('excludeで除外したディレクトリはたどらない', () => {
    expect(
      Object.keys(
        createExports({
          srcPath: dir,
          prefix: './src/',
          exclude: [{ valueType: 'base', conditions: /^foo$/ }],
        }),
      ),
    ).toEqual(['.', './__test__/sub', './_internal', './bar']);
  });

  it('target: distはビルド後のファイルを指す', () => {
    expect(
      createExports({ srcPath: dir, target: 'dist', requireExtension: false }),
    ).toEqual({
      '.': { import: { types: './index.d.mts', default: './index.mjs' } },
      './bar': {
        import: { types: './bar/index.d.mts', default: './bar/index.mjs' },
      },
      './foo': {
        import: { types: './foo/index.d.mts', default: './foo/index.mjs' },
      },
    });
  });

  it('extraExportsを生成したものより優先する', () => {
    expect(
      createExports({
        srcPath: dir,
        prefix: './src/',
        extraExports: {
          '.': './custom.ts',
          './package.json': './package.json',
        },
      }),
    ).toMatchObject({ '.': './custom.ts', './package.json': './package.json' });
  });

  it('prefixの既定値は/区切りに正規化したsrcPath', () => {
    const relative = path.relative(process.cwd(), dir);
    const expected = `./${path.posix.normalize(relative.replaceAll('\\', '/'))}/`;
    for (const srcPath of [relative, `${relative}/`, `${relative}\\`]) {
      expect(createExports({ srcPath })['.']).toBe(`${expected}index.ts`);
    }
  });

  it('srcPathが存在しない場合は例外を投げる', () => {
    expect(() => createExports({ srcPath: path.join(dir, 'missing') })).toThrow(
      'does not exist',
    );
  });
});
