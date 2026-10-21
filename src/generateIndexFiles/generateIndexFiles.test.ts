import path from 'path';
import type { MockInstance } from 'vitest';
import {
  createTempDir,
  exists,
  readFile,
  removeTempDir,
} from '../../test/tempDir';
import { NAMESPACE_DIR } from './constants';
import generateIndexFiles from './generateIndexFiles';

/**
 * デフォルトエクスポートのあるファイルの内容
 */
const D = 'export default 1;\n';

describe('generateIndexFiles', () => {
  let dir: string;
  let info: MockInstance<typeof console.info>;
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    info = vi.spyOn(console, 'info').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    removeTempDir(dir);
    vi.restoreAllMocks();
  });

  it('既定の設定で機能・カテゴリー・ルートのindexファイルを生成する', () => {
    dir = createTempDir({
      'number/keepInRange/constants.ts': D,
      'number/keepInRange/keepInRange.ts': D,
      'number/keepInRange/keepInRange.test.ts': D,
      'number/keepInRange/types.ts': D,
      'number/keepInRange/helper.d.ts': D,
      '_internal/helper.ts': D,
    });
    const indexPaths = generateIndexFiles({ srcPath: dir });

    expect(readFile(dir, 'number/keepInRange/index.ts')).toBe(
      [
        "export * from './constants';",
        "export { default, default as keepInRange } from './keepInRange';",
        "export type * from './types';",
        '',
      ].join('\n'),
    );
    expect(readFile(dir, 'number/index.ts')).toBe(
      "export * from './keepInRange';\n",
    );
    expect(readFile(dir, 'index.ts')).toBe("export * from './number';\n");
    expect(exists(dir, '_internal/index.ts')).toBe(false);
    expect(indexPaths).toEqual([
      path.resolve(dir, 'number/keepInRange/index.ts'),
      path.resolve(dir, 'number/index.ts'),
      path.resolve(dir, 'index.ts'),
    ]);
  });

  it('改行コードの既定値はLF', () => {
    dir = createTempDir({ 'a.ts': D, 'b.ts': D });
    generateIndexFiles({ srcPath: dir });
    expect(readFile(dir, 'index.ts')).not.toContain('\r');
  });

  it('eolを指定できる', () => {
    dir = createTempDir({ 'a.ts': D });
    generateIndexFiles({ srcPath: dir, eol: '\r\n' });
    expect(readFile(dir, 'index.ts')).toBe(
      "export { default as a } from './a';\r\n",
    );
  });

  it('大文字・小文字を区別せずに名前順で並べる', () => {
    dir = createTempDir({ 'b.ts': D, 'C.ts': D, 'a.ts': D });
    generateIndexFiles({ srcPath: dir });
    expect(readFile(dir, 'index.ts')).toBe(
      [
        "export { default as a } from './a';",
        "export { default as b } from './b';",
        "export { default as C } from './C';",
        '',
      ].join('\n'),
    );
  });

  describe('dryRun', () => {
    it('ファイルを書き込まず、本番と同じ内容を出力する', () => {
      dir = createTempDir({ 'foo/foo.ts': D, 'foo/bar/bar.ts': D });
      const dryRunPaths = generateIndexFiles({ srcPath: dir, dryRun: true });
      const dryRunOutput = info.mock.calls.map((args) => String(args[0]));
      expect(exists(dir, 'index.ts')).toBe(false);
      expect(exists(dir, 'foo/index.ts')).toBe(false);

      info.mockClear();
      const indexPaths = generateIndexFiles({ srcPath: dir });
      expect(dryRunPaths).toEqual(indexPaths);
      for (const indexPath of indexPaths) {
        expect(dryRunOutput).toContain(fsContent(indexPath));
      }
      expect(readFile(dir, 'foo/index.ts')).toBe(
        [
          "export * from './bar';",
          "export { default, default as foo } from './foo';",
          '',
        ].join('\n'),
      );
    });
  });

  describe('既存のindexファイル', () => {
    it('exportするものが無いディレクトリのindexファイルは残し、親からexportしない', () => {
      dir = createTempDir({
        'a.ts': D,
        'stale/index.ts': "export * from './removed';\n",
        'stale/stale.test.ts': '',
      });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'stale/index.ts')).toBe(
        "export * from './removed';\n",
      );
      expect(readFile(dir, 'index.ts')).toBe(
        "export { default as a } from './a';\n",
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('There is nothing to export'),
      );
    });

    it('indexファイルしか無いディレクトリは手書きのindexファイルとして残し、親からexportする', () => {
      const handwritten =
        "import '../../foo/styles.css';\n\nexport { default, default as foo } from '../../foo';\n";
      dir = createTempDir({ 'with-css/foo/index.ts': handwritten });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'with-css/foo/index.ts')).toBe(handwritten);
      expect(readFile(dir, 'with-css/index.ts')).toBe(
        "export * from './foo';\n",
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('ignoreで処理しないディレクトリは既存のindexファイルがあれば親からexportする', () => {
      dir = createTempDir({
        'legacy/index.ts': 'export const legacy = 1;\n',
        'empty/a.txt': '',
      });
      generateIndexFiles({
        srcPath: dir,
        ignore: [{ valueType: 'base', conditions: /^(legacy|empty)$/ }],
      });
      expect(readFile(dir, 'legacy/index.ts')).toBe(
        'export const legacy = 1;\n',
      );
      expect(readFile(dir, 'index.ts')).toBe("export * from './legacy';\n");
    });
  });

  describe('名前', () => {
    it('名前がexport名に使えない場合は例外を投げる', () => {
      dir = createTempDir({ '1st.ts': D });
      expect(() => generateIndexFiles({ srcPath: dir })).toThrow(
        'not a valid identifier',
      );
    });

    it('ケバブケースの名前はキャメルケースにしてexport名に使う', () => {
      dir = createTempDir({
        'scroll-snap/scroll-snap.ts': D,
        'my-file.ts': D,
      });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'scroll-snap/index.ts')).toBe(
        "export { default, default as scrollSnap } from './scroll-snap';\n",
      );
      expect(readFile(dir, 'index.ts')).toBe(
        [
          "export { default as myFile } from './my-file';",
          "export * from './scroll-snap';",
          '',
        ].join('\n'),
      );
    });

    it('名前をexport名に使わない形式なら例外を投げない', () => {
      dir = createTempDir({ 'my-file.ts': D });
      generateIndexFiles({
        srcPath: dir,
        exportDefault: [{ valueType: 'base', conditions: 'my-file' }],
      });
      expect(readFile(dir, 'index.ts')).toBe(
        "export { default } from './my-file';\n",
      );
    });

    it('予約語や非ASCIIの名前は使える', () => {
      dir = createTempDir({ 'class.ts': D, 'ほげ.ts': D });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toBe(
        [
          "export { default as class } from './class';",
          "export { default as ほげ } from './ほげ';",
          '',
        ].join('\n'),
      );
    });

    it('ディレクトリ名の.以降を拡張子として扱わない', () => {
      dir = createTempDir({ 'a.b/c.ts': D });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toBe("export * from './a.b';\n");
    });
  });

  it('omitNamedWithDefaultはデフォルトエクスポートがある場合に名前付きエクスポートを除く', () => {
    dir = createTempDir({
      'foo/foo.ts': D,
      'foo/helper.ts': D,
      'foo/constants.ts': D,
      'foo/types.ts': D,
    });
    generateIndexFiles({ srcPath: dir, omitNamedWithDefault: true });
    expect(readFile(dir, 'foo/index.ts')).toBe(
      [
        "export { default } from './foo';",
        "export type * from './types';",
        '',
      ].join('\n'),
    );
  });

  it('omitNamedWithDefaultでもデフォルトエクスポートが無ければ名前付きエクスポートを残す', () => {
    dir = createTempDir({ 'a.ts': D });
    generateIndexFiles({ srcPath: dir, omitNamedWithDefault: true });
    expect(readFile(dir, 'index.ts')).toBe(
      "export { default as a } from './a';\n",
    );
  });

  it('NAMESPACE_DIRで名前空間としてexportする', () => {
    dir = createTempDir({
      'tools/a.ts': D,
      'Widget/a.ts': D,
      'feature/feature.ts': D,
    });
    generateIndexFiles({ srcPath: dir, exportAllAs: [NAMESPACE_DIR] });
    expect(readFile(dir, 'index.ts')).toBe(
      [
        "export * from './feature';",
        "export * as tools from './tools';",
        "export * from './Widget';",
        '',
      ].join('\n'),
    );
  });

  it('transformで出力前に編集できる', () => {
    dir = createTempDir({ 'a.ts': D });
    generateIndexFiles({
      srcPath: dir,
      transform: (exports) => ['// generated', ...exports],
    });
    expect(readFile(dir, 'index.ts')).toBe(
      "// generated\nexport { default as a } from './a';\n",
    );
  });

  it('transformの第2引数でindexファイルのパスを受け取れる', () => {
    dir = createTempDir({ 'foo/foo.ts': D });
    const indexPaths: string[] = [];
    generateIndexFiles({
      srcPath: dir,
      transform: (exports, { indexPath }) => {
        indexPaths.push(indexPath);
        return exports;
      },
    });
    expect(indexPaths).toEqual([
      path.posix.join(dir.replaceAll('\\', '/'), 'foo/index.ts'),
      path.posix.join(dir.replaceAll('\\', '/'), 'index.ts'),
    ]);
  });

  describe('ファイルの中身に合わせた形式', () => {
    it.each([
      ['export default function a() {}\n'],
      ['export default class A {}\n'],
      ['const a = 1;\nexport { a as default };\n'],
      ["export { default } from './b';\n"],
    ])(
      'デフォルトエクスポートがあれば条件どおりの形式にする（%s）',
      (content) => {
        dir = createTempDir({ 'a.ts': content, 'b.ts': D });
        generateIndexFiles({ srcPath: dir });
        expect(readFile(dir, 'index.ts')).toContain(
          "export { default as a } from './a';",
        );
      },
    );

    it.each([
      ['export const a = 1;\n'],
      ['export function a() {}\n'],
      ['export class A {}\n'],
      ['export enum A {}\n'],
      ['const a = 1;\nexport { a };\n'],
      ["export * from './b';\n"],
      ["export * as b from './b';\n"],
    ])(
      '値の名前付きエクスポートだけの場合はexportAllにする（%s）',
      (content) => {
        dir = createTempDir({ 'a.ts': content, 'b.ts': D });
        generateIndexFiles({ srcPath: dir });
        expect(readFile(dir, 'index.ts')).toContain("export * from './a';");
      },
    );

    it.each([
      ['export type A = string;\n'],
      ['export interface A {}\n'],
      ["export type { B } from './b';\n"],
      ["export { type B } from './b';\n"],
      ["export type * from './b';\n"],
    ])('型のエクスポートだけの場合はexportTypeAllにする（%s）', (content) => {
      dir = createTempDir({ 'a.ts': content, 'b.ts': D });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toContain("export type * from './a';");
    });

    it('エクスポートが無い場合は副作用のためにimportし、exportより前に置く', () => {
      dir = createTempDir({
        'a.ts': D,
        'styles.ts': "import './styles.css';\n",
      });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toBe(
        ["import './styles';", "export { default as a } from './a';", ''].join(
          '\n',
        ),
      );
    });

    it('親ディレクトリと同じ名前のファイルでも、デフォルトエクスポートが無ければ中身に合わせる', () => {
      dir = createTempDir({ 'foo/foo.ts': 'export const foo = 1;\n' });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'foo/index.ts')).toBe("export * from './foo';\n");
    });

    it('デフォルトエクスポートを前提としない形式は中身を見ない', () => {
      dir = createTempDir({ 'constants.ts': '', 'types.ts': '' });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toBe(
        [
          "export * from './constants';",
          "export type * from './types';",
          '',
        ].join('\n'),
      );
    });
  });

  it('importSideEffectで副作用のためにimportする', () => {
    dir = createTempDir({ 'a.ts': D, 'setup.ts': D });
    generateIndexFiles({
      srcPath: dir,
      importSideEffect: [{ valueType: 'name', conditions: 'setup' }],
    });
    expect(readFile(dir, 'index.ts')).toBe(
      ["import './setup';", "export { default as a } from './a';", ''].join(
        '\n',
      ),
    );
  });

  it('srcPathがディレクトリでない場合は例外を投げる', () => {
    dir = createTempDir({ 'a.ts': D });
    expect(() =>
      generateIndexFiles({ srcPath: path.join(dir, 'a.ts') }),
    ).toThrow('is not a directory');
    expect(() =>
      generateIndexFiles({ srcPath: path.join(dir, 'missing') }),
    ).toThrow('does not exist');
  });
});

function fsContent(indexPath: string) {
  return readFile(path.dirname(indexPath), path.basename(indexPath));
}
