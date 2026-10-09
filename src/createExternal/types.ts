import type { IsMatchingPathCondition } from '../isMatchingPath';

/**
 * オプション
 */
export type CreateExternalOptions = {
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
 * include,excludeが関数だった場合のオプション
 */
export type ConditionOptions = {
  source: string;
  importer: string | undefined;
  isResolved: boolean;
};
