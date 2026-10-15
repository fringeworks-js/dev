import type { IsMatchingPathCondition } from '../isMatchingPath';

/**
 * オプション
 */
export type CreateExternalOptions = {
  /**
   * 内部モジュールとして扱うディレクトリのパス
   * 解決前のパスがこのディレクトリから始まるものは内部モジュールとする
   * @default 'src'
   */
  srcPath?: string;

  /**
   * 外部モジュールとする条件
   */
  isExternal?: IsMatchingPathCondition<ConditionOptions>[];

  /**
   * 内部モジュールとする条件
   */
  isInternal?: IsMatchingPathCondition<ConditionOptions>[];
};

/**
 * rolldownやrollupのexternalオプションに設定可能な関数
 */
export type ExternalFunction = (
  source: string,
  importer: string | undefined,
  isResolved: boolean,
) => boolean | null | undefined | void;

/**
 * isExternal,isInternalの条件が関数だった場合に第2引数に渡される値
 */
export type ConditionOptions = {
  source: string;
  importer: string | undefined;
  isResolved: boolean;
};
