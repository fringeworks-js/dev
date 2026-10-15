import path from 'path';
import {
  createTempDir,
  exists,
  readFile,
  removeTempDir,
} from '../../test/tempDir';
import moveFilesToSubdirs from './moveFilesToSubdirs';

describe('moveFilesToSubdirs', () => {
  let dir: string;

  afterEach(() => {
    removeTempDir(dir);
  });

  it('ファイルを同じ名前のサブディレクトリに移動する（ディレクトリは対象外）', () => {
    dir = createTempDir({ 'foo.ts': 'foo', 'sub/a.ts': '' });
    moveFilesToSubdirs(dir);
    expect(readFile(dir, 'foo/foo.ts')).toBe('foo');
    expect(exists(dir, 'foo.ts')).toBe(false);
    expect(exists(dir, 'sub/a.ts')).toBe(true);
    expect(exists(dir, 'foo/index.ts')).toBe(false);
  });

  it('indexを指定するとgenerateIndexFilesと同じ形式のindexファイルを作る', () => {
    dir = createTempDir({ 'foo.ts': '', 'abc.tsx': '' });
    moveFilesToSubdirs(dir, { index: true });
    expect(readFile(dir, 'foo/index.ts')).toBe(
      "export { default, default as foo } from './foo';\n",
    );
    expect(readFile(dir, 'abc/index.tsx')).toBe(
      "export { default as abc, default } from './abc';\n",
    );
  });

  it('include・excludeで対象を絞る', () => {
    dir = createTempDir({ 'a.ts': '', 'b.ts': '', 'c.js': '' });
    moveFilesToSubdirs(dir, { include: [/\.ts$/], exclude: [/b\.ts$/] });
    expect(exists(dir, 'a/a.ts')).toBe(true);
    expect(exists(dir, 'b.ts')).toBe(true);
    expect(exists(dir, 'c.js')).toBe(true);
  });

  it('afterMoveに移動先とファイル名を渡す', () => {
    dir = createTempDir({ 'foo.ts': '' });
    const afterMove = vi.fn();
    moveFilesToSubdirs(dir, { afterMove });
    expect(afterMove).toHaveBeenCalledWith(path.join(dir, 'foo'), 'foo.ts');
  });

  it('indexを指定してファイル名がexport名に使えない場合は移動前に例外を投げる', () => {
    dir = createTempDir({ 'my-file.ts': '' });
    expect(() => moveFilesToSubdirs(dir, { index: true })).toThrow(
      'not a valid identifier',
    );
    expect(exists(dir, 'my-file.ts')).toBe(true);
  });

  it('indexを指定しなければファイル名は問わない', () => {
    dir = createTempDir({ 'my-file.ts': '' });
    moveFilesToSubdirs(dir);
    expect(exists(dir, 'my-file/my-file.ts')).toBe(true);
  });

  it('dirPathがディレクトリでない場合は例外を投げる', () => {
    dir = createTempDir();
    expect(() => moveFilesToSubdirs(path.join(dir, 'missing'))).toThrow(
      'does not exist',
    );
  });
});
