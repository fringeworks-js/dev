import fs from "fs-extra";
import createExportEntry from "../_internal/createExportEntry";
import type { GeneratePublishPackageJsonOptions } from "./types";

async function generatePublishPackageJson(
  options: GeneratePublishPackageJsonOptions = {},
) {
  const {
    packageJsonPath = "./package.json",
    outputPackageJsonPath = "./dist/package.json",
    exports = {
      ".": createExportEntry("./index"),
      "./*": createExportEntry("./*/index"),
      "./constants": createExportEntry("./constants"),
      "./*/constants": createExportEntry("./*/constants"),
    },
    transform = (pkgJson) => pkgJson,
    jsonReadOptions,
    jsonWriteOptions,
  } = options;
  const packageJson = await fs.readJSON(packageJsonPath, jsonReadOptions);
  const distPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    keywords: packageJson.keywords,
    repository: packageJson.repository,
    license: packageJson.license,
    author: packageJson.author,
    type: packageJson.type,
    exports,
    dependencies: packageJson.dependencies,
  };
  await fs.writeJSON(
    outputPackageJsonPath,
    transform(distPackageJson),
    jsonWriteOptions,
  );
}

export default generatePublishPackageJson;
