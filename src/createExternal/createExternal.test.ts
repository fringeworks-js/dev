import createExternal from './createExternal';

describe('createExternal', () => {
  describe('既定の判定（解決前）', () => {
    const external = createExternal();

    it.each(['react', 'react/jsx-runtime', '@fringeworks/utils', 'node:fs'])(
      '%sは外部モジュール',
      (source) => {
        expect(external(source, undefined, false)).toBe(true);
      },
    );

    it.each([
      './foo',
      '../foo',
      '.',
      '/abs/foo',
      '\\abs\\foo',
      '\0virtual',
      '#internal',
      'C:\\foo\\bar',
      'C:/foo/bar',
      'src/foo',
    ])('%sは内部モジュール', (source) => {
      expect(external(source, undefined, false)).toBe(false);
    });

    it('srcで始まっても別のディレクトリなら外部モジュール', () => {
      expect(external('srcx/foo', undefined, false)).toBe(true);
    });
  });

  it('解決後のパスは判定しない', () => {
    const external = createExternal();
    expect(external('react', 'src/index.ts', true)).toBeUndefined();
    expect(external('C:\\project\\src\\a.ts', undefined, true)).toBeUndefined();
  });

  describe('srcPath', () => {
    it('指定したディレクトリを内部モジュールにする', () => {
      const external = createExternal({ srcPath: 'lib' });
      expect(external('lib/foo', undefined, false)).toBe(false);
      expect(external('src/foo', undefined, false)).toBe(true);
    });

    it.each(['./lib', 'lib/', 'lib\\'])('%sも正規化する', (srcPath) => {
      const external = createExternal({ srcPath });
      expect(external('lib/foo', undefined, false)).toBe(false);
    });
  });

  describe('isExternal・isInternal', () => {
    it('isExternalに一致すれば外部モジュール（パスは正規化して検査する）', () => {
      const external = createExternal({ isExternal: [/^vendor\//] });
      expect(external('./vendor/a', undefined, false)).toBe(true);
      expect(external('C:\\vendor\\a', undefined, true)).toBeUndefined();
    });

    it('isInternalに一致すれば内部モジュール', () => {
      const external = createExternal({ isInternal: [/^@\//] });
      expect(external('@/foo', undefined, false)).toBeUndefined();
    });

    it('isExternalをisInternalより優先する', () => {
      const external = createExternal({
        isExternal: ['shared'],
        isInternal: ['shared'],
      });
      expect(external('shared', undefined, false)).toBe(true);
    });

    it('条件の関数に{ source, importer, isResolved }を渡す', () => {
      const fn = vi.fn(() => false);
      createExternal({ isExternal: [fn] })('react', 'src/a.ts', false);
      expect(fn).toHaveBeenCalledWith(expect.anything(), {
        source: 'react',
        importer: 'src/a.ts',
        isResolved: false,
      });
    });

    it('entryTypeを指定した条件でも存在しないパスで例外を投げない', () => {
      const external = createExternal({
        isInternal: [{ entryType: 'file', conditions: 'react' }],
      });
      expect(external('react', undefined, false)).toBe(true);
    });
  });
});
