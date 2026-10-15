import fs from 'fs-extra';
import path from 'path';
import { createTempDir, removeTempDir } from '../../test/tempDir';
import isMatchingPath from './isMatchingPath';
import type { ConditionConfig } from './types';

describe('isMatchingPath', () => {
  describe('条件の種類', () => {
    it('文字列はパスに含まれていれば一致', () => {
      expect(isMatchingPath('src/foo/bar.ts', 'foo/')).toBe(true);
      expect(isMatchingPath('src/foo/bar.ts', 'baz')).toBe(false);
    });

    it('正規表現はパスに一致すれば一致', () => {
      expect(isMatchingPath('src/foo/bar.ts', /\.ts$/)).toBe(true);
      expect(isMatchingPath('src/foo/bar.ts', /\.js$/)).toBe(false);
    });

    it('配列はOR条件', () => {
      expect(isMatchingPath('src/foo/bar.ts', ['baz', /bar/])).toBe(true);
      expect(isMatchingPath('src/foo/bar.ts', ['baz', /qux/])).toBe(false);
    });

    it('null・undefinedは一致しない', () => {
      expect(isMatchingPath('src/foo/bar.ts', null)).toBe(false);
      expect(isMatchingPath('src/foo/bar.ts', undefined)).toBe(false);
    });

    it('空配列は一致しない', () => {
      expect(isMatchingPath('src/foo/bar.ts', [])).toBe(false);
    });

    it('関数には値とconditionOptionsが渡される', () => {
      const fn = vi.fn(() => true);
      expect(
        isMatchingPath('src/foo/bar.ts', fn, {
          conditionOptions: { flag: 1 },
        }),
      ).toBe(true);
      expect(fn).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'src/foo/bar.ts',
          base: 'bar.ts',
          name: 'bar',
          ext: '.ts',
          dirpath: 'src/foo',
          dirbase: 'foo',
        }),
        { flag: 1 },
      );
    });

    it('conditionOptionsを省略すると関数には空のオブジェクトが渡される', () => {
      const fn = vi.fn(() => false);
      isMatchingPath('a.ts', fn);
      expect(fn).toHaveBeenCalledWith(expect.anything(), {});
    });
  });

  describe('条件設定', () => {
    it('valueTypeで検査する値を選ぶ', () => {
      const target = 'src/foo.bar/baz.test.ts';
      const cases: [NonNullable<ConditionConfig['valueType']>, string][] = [
        ['path', 'src/foo.bar/baz.test.ts'],
        ['base', 'baz.test.ts'],
        ['name', 'baz.test'],
        ['ext', '.ts'],
        ['dirpath', 'src/foo.bar'],
        ['dirbase', 'foo.bar'],
        ['dirname', 'foo'],
        ['dirext', '.bar'],
      ];
      for (const [valueType, expected] of cases) {
        expect(
          isMatchingPath(target, {
            valueType,
            conditions: new RegExp(`^${expected.replace(/\./g, '\\.')}$`),
          }),
        ).toBe(true);
      }
    });

    it('conditionsの配列はAND条件', () => {
      const condition = {
        valueType: 'base' as const,
        conditions: [/^baz/, /\.ts$/],
      };
      expect(isMatchingPath('src/baz.ts', condition)).toBe(true);
      expect(isMatchingPath('src/baz.js', condition)).toBe(false);
    });

    it('conditionsの関数にも値が渡される', () => {
      expect(
        isMatchingPath('src/foo/foo.ts', {
          conditions: (values) => values.name === values.dirbase,
        }),
      ).toBe(true);
    });
  });

  describe('パスの正規化', () => {
    it('Windowsの\\区切りのパスも/区切りとして分解する', () => {
      const fn = vi.fn(() => true);
      isMatchingPath('src\\foo\\types.ts', fn);
      expect(fn).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'src/foo/types.ts',
          base: 'types.ts',
          dirpath: 'src/foo',
          dirbase: 'foo',
        }),
        {},
      );
      expect(
        isMatchingPath('src\\foo\\types.ts', {
          valueType: 'base',
          conditions: /^types\.ts$/,
        }),
      ).toBe(true);
    });

    it('./や../を正規化する', () => {
      expect(isMatchingPath('./src/foo/../bar.ts', /^src\/bar\.ts$/)).toBe(
        true,
      );
    });
  });

  describe('entryType', () => {
    let dir: string;

    beforeEach(() => {
      dir = createTempDir({ 'file.ts': '', 'sub/': '' });
    });

    afterEach(() => {
      removeTempDir(dir);
      vi.restoreAllMocks();
    });

    it('fileはファイルだけに一致', () => {
      const condition = { entryType: 'file' as const, conditions: '' };
      expect(isMatchingPath(path.join(dir, 'file.ts'), condition)).toBe(true);
      expect(isMatchingPath(path.join(dir, 'sub'), condition)).toBe(false);
    });

    it('dirはディレクトリだけに一致', () => {
      const condition = { entryType: 'dir' as const, conditions: '' };
      expect(isMatchingPath(path.join(dir, 'file.ts'), condition)).toBe(false);
      expect(isMatchingPath(path.join(dir, 'sub'), condition)).toBe(true);
    });

    it('存在しないパスはfile・dirに一致せず、例外も投げない', () => {
      const target = path.join(dir, 'missing.ts');
      expect(
        isMatchingPath(target, { entryType: 'file', conditions: '' }),
      ).toBe(false);
      expect(isMatchingPath(target, { entryType: 'dir', conditions: '' })).toBe(
        false,
      );
    });

    it('bothは存在を確認しない', () => {
      expect(
        isMatchingPath('react', { entryType: 'both', conditions: 'react' }),
      ).toBe(true);
    });

    it('複数の条件があっても種別の確認は1回だけ', () => {
      const spy = vi.spyOn(fs, 'statSync');
      isMatchingPath(path.join(dir, 'file.ts'), [
        { entryType: 'dir', conditions: '' },
        { entryType: 'dir', conditions: '' },
        { entryType: 'file', conditions: 'nomatch' },
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('entryTypeを指定しない条件では種別を確認しない', () => {
      const spy = vi.spyOn(fs, 'statSync');
      isMatchingPath(path.join(dir, 'file.ts'), [/file/, { conditions: '' }]);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
