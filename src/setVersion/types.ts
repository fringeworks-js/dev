export type SetVersionOptions = {
  /**
   * ワークスペースのパッケージjsonのパス
   * @default `./package.json`
   */
  workspacePackageJsonPath?: string;

  /**
   * パッケージが置かれたディレクトリのパス
   * @default `./packages`
   */
  packagesPath?: string;
};
