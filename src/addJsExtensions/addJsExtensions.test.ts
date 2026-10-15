import path from 'path';
import type { MockInstance } from 'vitest';
import { createTempDir, readFile, removeTempDir } from '../../test/tempDir';
import addJsExtensions from './addJsExtensions';

describe('addJsExtensions', () => {
  let dir: string;
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    removeTempDir(dir);
    vi.restoreAllMocks();
  });

  it('.jsファイルの相対importに拡張子を付ける', () => {
    dir = createTempDir({
      'index.js': [
        "import a from './a';",
        "import { b } from './sub/b';",
        "export * from './a';",
        "import './a';",
        "const c = await import('./a');",
        "import x from 'external';",
        '',
      ].join('\n'),
      'a.js': '',
      'sub/b.js': '',
    });
    addJsExtensions(dir);
    expect(readFile(dir, 'index.js')).toBe(
      [
        "import a from './a.js';",
        "import { b } from './sub/b.js';",
        "export * from './a.js';",
        "import './a.js';",
        "const c = await import('./a.js');",
        "import x from 'external';",
        '',
      ].join('\n'),
    );
  });

  it('ディレクトリを指す場合は/indexと拡張子を付ける', () => {
    dir = createTempDir({
      'sub/c.js': [
        "export * from '.';",
        "export * from '..';",
        "export * from '../feature';",
        "export * from '../feature/';",
        '',
      ].join('\n'),
      'sub/index.js': '',
      'index.js': '',
      'feature/index.js': '',
    });
    addJsExtensions(dir);
    expect(readFile(dir, 'sub/c.js')).toBe(
      [
        "export * from './index.js';",
        "export * from '../index.js';",
        "export * from '../feature/index.js';",
        "export * from '../feature/index.js';",
        '',
      ].join('\n'),
    );
  });

  it('同じ名前のファイルとディレクトリがある場合はファイルを優先する', () => {
    dir = createTempDir({
      'index.js': "export * from './a';\n",
      'a.js': '',
      'a/index.js': '',
    });
    addJsExtensions(dir);
    expect(readFile(dir, 'index.js')).toBe("export * from './a.js';\n");
  });

  it('既にファイルを指している場合はそのまま', () => {
    const content = [
      "import a from './a.js';",
      "import data from './data.json' with { type: 'json' };",
      "import './style.css';",
      '',
    ].join('\n');
    dir = createTempDir({
      'index.js': content,
      'a.js': '',
      'data.json': '{}',
      'style.css': '',
    });
    addJsExtensions(dir);
    expect(readFile(dir, 'index.js')).toBe(content);
    expect(warn).not.toHaveBeenCalled();
  });

  it('.mjs・.cjsファイルにはそれぞれの拡張子を付ける', () => {
    dir = createTempDir({
      'index.mjs': "export * from './a';\n",
      'a.mjs': '',
      'index.cjs': [
        "const a = require('./a');",
        'const b = require("./b");',
        '',
      ].join('\n'),
      'a.cjs': '',
      'b/index.cjs': '',
    });
    addJsExtensions(dir);
    expect(readFile(dir, 'index.mjs')).toBe("export * from './a.mjs';\n");
    expect(readFile(dir, 'index.cjs')).toBe(
      [
        "const a = require('./a.cjs');",
        'const b = require("./b/index.cjs");',
        '',
      ].join('\n'),
    );
  });

  it('解決できない場合は書き換えずに警告を出力する', () => {
    dir = createTempDir({ 'index.js': "export * from './missing';\n" });
    addJsExtensions(dir);
    expect(readFile(dir, 'index.js')).toBe("export * from './missing';\n");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot resolve "./missing"'),
    );
  });

  it('dirがディレクトリでない場合は例外を投げる', () => {
    dir = createTempDir({ 'a.js': '' });
    expect(() => addJsExtensions(path.join(dir, 'missing'))).toThrow(
      'does not exist',
    );
    expect(() => addJsExtensions(path.join(dir, 'a.js'))).toThrow(
      'is not a directory',
    );
  });
});
