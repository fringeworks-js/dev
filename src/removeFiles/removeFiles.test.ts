import { createTempDir, exists, removeTempDir } from '../../test/tempDir';
import removeFiles from './removeFiles';

describe('removeFiles', () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir({
      'a.js': '',
      'a.js.map': '',
      'sub/b.js.map': '',
    });
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  it('パターンに一致するファイルを削除する', () => {
    removeFiles('**/*.map', { cwd: dir });
    expect(exists(dir, 'a.js')).toBe(true);
    expect(exists(dir, 'a.js.map')).toBe(false);
    expect(exists(dir, 'sub/b.js.map')).toBe(false);
  });

  it('パターンを配列で指定できる', () => {
    removeFiles(['a.js', 'sub/*'], { cwd: dir });
    expect(exists(dir, 'a.js')).toBe(false);
    expect(exists(dir, 'a.js.map')).toBe(true);
    expect(exists(dir, 'sub/b.js.map')).toBe(false);
  });

  it('一致するファイルが無くても例外を投げない', () => {
    expect(() => removeFiles('*.none', { cwd: dir })).not.toThrow();
  });
});
