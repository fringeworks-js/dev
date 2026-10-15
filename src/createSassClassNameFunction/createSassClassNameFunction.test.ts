import { compileString, SassNumber, SassString } from 'sass';
import createSassClassNameFunction from './createSassClassNameFunction';

describe('createSassClassNameFunction', () => {
  const CLASS_NAMES = {
    stack: 'frg-layout-stack',
    'layout-stack-item': 'frg-layout-stack-item',
  };

  it('キーに対応するクラス名をSassの文字列で返す', () => {
    const fn = createSassClassNameFunction(CLASS_NAMES);
    const result = fn([new SassString('stack')]);
    expect(result).toBeInstanceOf(SassString);
    expect(result.text).toBe('frg-layout-stack');
  });

  it('prefix・suffixを付けたキーで引く', () => {
    const fn = createSassClassNameFunction(CLASS_NAMES, {
      prefix: 'layout-',
      suffix: '-item',
    });
    expect(fn([new SassString('stack')]).text).toBe('frg-layout-stack-item');
  });

  it('キーに対応するクラス名が無い場合は例外を投げる', () => {
    const fn = createSassClassNameFunction(CLASS_NAMES);
    expect(() => fn([new SassString('missing')])).toThrow(
      'The class name for "missing" is not defined.',
    );
  });

  it('引数が文字列でない場合は例外を投げる', () => {
    const fn = createSassClassNameFunction(CLASS_NAMES);
    expect(() => fn([new SassNumber(1)])).toThrow('$name');
    expect(() => fn([])).toThrow('$name');
  });

  describe('Sassのカスタム関数として使う', () => {
    const functions = {
      'cls($name)': createSassClassNameFunction(CLASS_NAMES),
    };

    it('クラス名を展開する', () => {
      const { css } = compileString('.#{cls("stack")} { display: flex; }', {
        functions,
      });
      expect(css).toContain('.frg-layout-stack');
    });

    it('クラス名が無い場合はSassのエラーにする', () => {
      expect(() =>
        compileString('.#{cls("missing")} { display: flex; }', { functions }),
      ).toThrow('The class name for "missing" is not defined.');
    });
  });
});
