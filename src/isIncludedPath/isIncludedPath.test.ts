import path from 'path';
import { createTempDir, removeTempDir } from '../../test/tempDir';
import isIncludedPath from './isIncludedPath';

describe('isIncludedPath', () => {
  let dir: string;
  let file: string;
  let sub: string;

  beforeEach(() => {
    dir = createTempDir({ 'foo.ts': '', 'sub/': '' });
    file = path.join(dir, 'foo.ts');
    sub = path.join(dir, 'sub');
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  describe('entryType', () => {
    it('既定値はfile', () => {
      expect(isIncludedPath(file)).toBe(true);
      expect(isIncludedPath(sub)).toBe(false);
    });

    it('dir', () => {
      expect(isIncludedPath(file, { entryType: 'dir' })).toBe(false);
      expect(isIncludedPath(sub, { entryType: 'dir' })).toBe(true);
    });

    it('both', () => {
      expect(isIncludedPath(file, { entryType: 'both' })).toBe(true);
      expect(isIncludedPath(sub, { entryType: 'both' })).toBe(true);
    });

    it('存在しないパスは含まれず、例外も投げない', () => {
      const missing = path.join(dir, 'missing.ts');
      expect(isIncludedPath(missing, { entryType: 'both' })).toBe(false);
    });
  });

  describe('include・exclude', () => {
    it('includeに一致するものだけ含む', () => {
      expect(isIncludedPath(file, { include: [/\.ts$/] })).toBe(true);
      expect(isIncludedPath(file, { include: [/\.js$/] })).toBe(false);
    });

    it('excludeに一致するものは含まない', () => {
      expect(isIncludedPath(file, { exclude: [/\.ts$/] })).toBe(false);
      expect(isIncludedPath(file, { exclude: [/\.js$/] })).toBe(true);
    });

    it('include・exclude未指定時はdefaultInclude・defaultExcludeを使う', () => {
      expect(isIncludedPath(file, { defaultInclude: [/\.js$/] })).toBe(false);
      expect(isIncludedPath(file, { defaultExclude: [/\.ts$/] })).toBe(false);
    });

    it('include・excludeを指定するとdefaultInclude・defaultExcludeは使わない', () => {
      expect(
        isIncludedPath(file, {
          include: [/\.ts$/],
          defaultInclude: [/\.js$/],
          exclude: [],
          defaultExclude: [/\.ts$/],
        }),
      ).toBe(true);
    });

    it('conditionOptionsを条件の関数に渡す', () => {
      const fn = vi.fn(() => true);
      isIncludedPath(file, { include: [fn], conditionOptions: { flag: 1 } });
      expect(fn).toHaveBeenCalledWith(expect.anything(), { flag: 1 });
    });
  });
});
