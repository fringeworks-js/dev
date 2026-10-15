/**
 * 名前が識別子として使えるか
 * export名は予約語も使えるため、IdentifierNameの形式だけを確認する
 */
const IDENTIFIER_NAME = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200C\u200D]*$/u;

/**
 * export名に使えるか判定する
 * @param name 名前
 */
export function isIdentifierName(name: string) {
  return IDENTIFIER_NAME.test(name);
}

/**
 * exportの形式
 *
 * - type: exportの種類。デフォルトと名前付きの混在を判定するのに使う
 * - exportsName: 名前をexport名として使うか
 * - generate: exportのコード
 * - generateDefaultOnly: 名前付きエクスポートを除外する場合のコード
 */
export const EXPORT_FORMS = {
  exportAllAs: {
    type: 'named',
    exportsName: true,
    generate: (name: string) => `export * as ${name} from './${name}';`,
  },
  exportDefault: {
    type: 'default',
    exportsName: false,
    generate: (name: string) => `export { default } from './${name}';`,
  },
  exportDefaultAndNamed: {
    type: 'both',
    exportsName: true,
    // organize-importsで整形した場合と同じ順序で出力する
    // export名を文字コード順で比較し、`default`より前の名前なら先に置く
    generate: (name: string) =>
      name < 'default'
        ? `export { default as ${name}, default } from './${name}';`
        : `export { default, default as ${name} } from './${name}';`,
    generateDefaultOnly: (name: string) =>
      `export { default } from './${name}';`,
  },
  exportDefaultAs: {
    type: 'named',
    exportsName: true,
    generate: (name: string) =>
      `export { default as ${name} } from './${name}';`,
  },
  exportTypeAll: {
    type: 'type',
    exportsName: false,
    generate: (name: string) => `export type * from './${name}';`,
  },
  exportAll: {
    type: 'named',
    exportsName: false,
    generate: (name: string) => `export * from './${name}';`,
  },
} as const;

/**
 * exportの形式の名前
 */
export type ExportForm = keyof typeof EXPORT_FORMS;
