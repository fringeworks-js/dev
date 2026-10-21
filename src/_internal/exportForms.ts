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
 * - type: exportの種類。デフォルトと名前付きの混在を判定するのに使う（sideEffectはexportしない）
 * - exportsName: 名前をexport名として使うか
 * - requiresDefault: 対象のモジュールにデフォルトエクスポートが必要か
 * - generate: exportのコード。moduleNameを省略した場合はexport名と同じ
 * - generateDefaultOnly: 名前付きエクスポートを除外する場合のコード
 */
export const EXPORT_FORMS = {
  importSideEffect: {
    type: 'sideEffect',
    exportsName: false,
    requiresDefault: false,
    generate: (name: string, moduleName = name) => `import './${moduleName}';`,
  },
  exportAllAs: {
    type: 'named',
    exportsName: true,
    requiresDefault: false,
    generate: (name: string, moduleName = name) =>
      `export * as ${name} from './${moduleName}';`,
  },
  exportDefault: {
    type: 'default',
    exportsName: false,
    requiresDefault: true,
    generate: (name: string, moduleName = name) =>
      `export { default } from './${moduleName}';`,
  },
  exportDefaultAndNamed: {
    type: 'both',
    exportsName: true,
    requiresDefault: true,
    // organize-importsで整形した場合と同じ順序で出力する
    // export名を文字コード順で比較し、`default`より前の名前なら先に置く
    generate: (name: string, moduleName = name) =>
      name < 'default'
        ? `export { default as ${name}, default } from './${moduleName}';`
        : `export { default, default as ${name} } from './${moduleName}';`,
    generateDefaultOnly: (name: string, moduleName = name) =>
      `export { default } from './${moduleName}';`,
  },
  exportDefaultAs: {
    type: 'named',
    exportsName: true,
    requiresDefault: true,
    generate: (name: string, moduleName = name) =>
      `export { default as ${name} } from './${moduleName}';`,
  },
  exportTypeAll: {
    type: 'type',
    exportsName: false,
    requiresDefault: false,
    generate: (name: string, moduleName = name) =>
      `export type * from './${moduleName}';`,
  },
  exportAll: {
    type: 'named',
    exportsName: false,
    requiresDefault: false,
    generate: (name: string, moduleName = name) =>
      `export * from './${moduleName}';`,
  },
} as const;

/**
 * export名に使えない名前を、使える名前に変換する
 * ケバブケース（`scroll-snap`）はキャメルケース（`scrollSnap`）にし、変換しても使えない場合はundefinedを返す
 * @param name 名前
 */
export function toExportName(name: string): string | undefined {
  if (isIdentifierName(name)) {
    return name;
  }
  const camelCase = name.replace(/-+(.)/gu, (_, char: string) =>
    char.toUpperCase(),
  );
  return camelCase !== name && isIdentifierName(camelCase)
    ? camelCase
    : undefined;
}

/**
 * exportの形式の名前
 */
export type ExportForm = keyof typeof EXPORT_FORMS;
