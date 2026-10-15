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
      'number/keepInRange/constants.ts': '',
      'number/keepInRange/keepInRange.ts': '',
      'number/keepInRange/keepInRange.test.ts': '',
      'number/keepInRange/types.ts': '',
      'number/keepInRange/helper.d.ts': '',
      '_internal/helper.ts': '',
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
    dir = createTempDir({ 'a.ts': '', 'b.ts': '' });
    generateIndexFiles({ srcPath: dir });
    expect(readFile(dir, 'index.ts')).not.toContain('\r');
  });

  it('eolを指定できる', () => {
    dir = createTempDir({ 'a.ts': '' });
    generateIndexFiles({ srcPath: dir, eol: '\r\n' });
    expect(readFile(dir, 'index.ts')).toBe(
      "export { default as a } from './a';\r\n",
    );
  });

  it('大文字・小文字を区別せずに名前順で並べる', () => {
    dir = createTempDir({ 'b.ts': '', 'C.ts': '', 'a.ts': '' });
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
      dir = createTempDir({ 'foo/foo.ts': '', 'foo/bar/bar.ts': '' });
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
        'a.ts': '',
        'stale/index.ts': "export * from './removed';\n",
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
      dir = createTempDir({ 'my-file.ts': '' });
      expect(() => generateIndexFiles({ srcPath: dir })).toThrow(
        'not a valid identifier',
      );
    });

    it('名前をexport名に使わない形式なら例外を投げない', () => {
      dir = createTempDir({ 'my-file.ts': '' });
      generateIndexFiles({
        srcPath: dir,
        exportDefault: [{ valueType: 'base', conditions: 'my-file' }],
      });
      expect(readFile(dir, 'index.ts')).toBe(
        "export { default } from './my-file';\n",
      );
    });

    it('予約語や非ASCIIの名前は使える', () => {
      dir = createTempDir({ 'class.ts': '', 'ほげ.ts': '' });
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
      dir = createTempDir({ 'a.b/c.ts': '' });
      generateIndexFiles({ srcPath: dir });
      expect(readFile(dir, 'index.ts')).toBe("export * from './a.b';\n");
    });
  });

  it('omitNamedWithDefaultはデフォルトエクスポートがある場合に名前付きエクスポートを除く', () => {
    dir = createTempDir({
      'foo/foo.ts': '',
      'foo/helper.ts': '',
      'foo/constants.ts': '',
      'foo/types.ts': '',
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
    dir = createTempDir({ 'a.ts': '' });
    generateIndexFiles({ srcPath: dir, omitNamedWithDefault: true });
    expect(readFile(dir, 'index.ts')).toBe(
      "export { default as a } from './a';\n",
    );
  });

  it('NAMESPACE_DIRで名前空間としてexportする', () => {
    dir = createTempDir({
      'tools/a.ts': '',
      'Widget/a.ts': '',
      'feature/feature.ts': '',
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
    dir = createTempDir({ 'a.ts': '' });
    generateIndexFiles({
      srcPath: dir,
      transform: (exports) => ['// generated', ...exports],
    });
    expect(readFile(dir, 'index.ts')).toBe(
      "// generated\nexport { default as a } from './a';\n",
    );
  });

  it('srcPathがディレクトリでない場合は例外を投げる', () => {
    dir = createTempDir({ 'a.ts': '' });
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
