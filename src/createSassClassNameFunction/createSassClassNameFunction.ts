import type { Value } from 'sass';
import { SassString } from 'sass';
import type { CreateSassClassNameFunctionOptions } from './types';

/**
 * TypeScriptで定義したCSSのクラス名をsassに反映するカスタム関数
 * @param classNames クラス名
 * @returns
 */
export default function createSassClassNameFunction(
  classNames: Record<string, string>,
  options: CreateSassClassNameFunctionOptions = {},
) {
  const { prefix = '', suffix = '' } = options;
  return (args: Value[]) => {
    const name = (args[0] as SassString).text;
    return new SassString(classNames[prefix + name + suffix]);
  };
}
