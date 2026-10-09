/**
 * exportsの値に使う拡張子
 * falseの場合はその条件・型定義を出力しない
 */
export type ExportEntryExtensions = {
  importExtension?: string | false;
  requireExtension?: string | false;
  importTypesExtension?: string | false;
  requireTypesExtension?: string | false;
};

/**
 * 条件付きexportsの値
 */
export type ExportEntry = Partial<
  Record<"import" | "require", string | { types: string; default: string }>
>;

/**
 * 拡張子のデフォルト値（tsdownでESMとCJSを出力した際のファイル）
 */
export const DEFAULT_EXPORT_ENTRY_EXTENSIONS = {
  importExtension: ".mjs",
  requireExtension: ".cjs",
  importTypesExtension: ".d.mts",
  requireTypesExtension: ".d.cts",
} as const satisfies ExportEntryExtensions;

/**
 * 条件付きexportsの値を作る
 * @param basePath 拡張子を除いたパス（例: `./foo/index`）
 * @param extensions 拡張子
 */
export default function createExportEntry(
  basePath: string,
  extensions: ExportEntryExtensions = {},
) {
  const {
    importExtension,
    requireExtension,
    importTypesExtension,
    requireTypesExtension,
  } = { ...DEFAULT_EXPORT_ENTRY_EXTENSIONS, ...extensions };
  const entry: ExportEntry = {};
  const conditions = [
    ["import", importExtension, importTypesExtension],
    ["require", requireExtension, requireTypesExtension],
  ] as const;
  for (const [condition, extension, typesExtension] of conditions) {
    if (extension === false) {
      continue;
    }
    entry[condition] =
      typesExtension === false
        ? basePath + extension
        : {
            types: basePath + typesExtension,
            default: basePath + extension,
          };
  }
  return entry;
}
