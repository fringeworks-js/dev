import type { Value } from 'sass';
import { SassString, sassNull } from 'sass';
import type { CreateSassClassNameFunctionOptions } from './types';

/**
 * TypeScriptで定義したCSSのクラス名をsassに反映するカスタム関数を作る\
 * 作られた関数は、引数が文字列でない場合や、キーに対応するクラス名が無い場合はSassのエラーにする
 * @param classNames キーとクラス名のオブジェクト
 * @param options オプション
 */
export default function createSassClassNameFunction(
  classNames: Record<string, string>,
  options: CreateSassClassNameFunctionOptions = {},
) {
  const { prefix = '', suffix = '' } = options;
  return (args: Value[]) => {
    const name = (args[0] ?? sassNull).assertString('name').text;
    const key = prefix + name + suffix;
    const className = classNames[key];
    if (className === undefined) {
      throw new Error(`The class name for "${key}" is not defined.`);
    }
    return new SassString(className);
  };
}
