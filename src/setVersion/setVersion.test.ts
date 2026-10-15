import path from 'path';
import { createTempDir, readFile, removeTempDir } from '../../test/tempDir';
import setVersion from './setVersion';

describe('setVersion', () => {
  let dir: string;
  let workspacePackageJsonPath: string;
  let packagesPath: string;

  beforeEach(() => {
    dir = createTempDir({
      'package.json': JSON.stringify({ name: 'root', version: '0.1.0' }),
      'packages/a/package.json': JSON.stringify({
        name: 'a',
        version: '0.1.0',
      }),
      'packages/b/package.json': JSON.stringify({
        name: 'b',
        version: '0.2.0',
      }),
      'packages/c/readme.md': '',
    });
    workspacePackageJsonPath = path.join(dir, 'package.json');
    packagesPath = path.join(dir, 'packages');
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  it('ワークスペースと各パッケージのバージョンを書き換える', () => {
    setVersion('1.0.0', { workspacePackageJsonPath, packagesPath });
    for (const file of [
      'package.json',
      'packages/a/package.json',
      'packages/b/package.json',
    ]) {
      expect(JSON.parse(readFile(dir, file)).version).toBe('1.0.0');
    }
    expect(readFile(dir, 'packages/a/package.json')).toBe(
      '{\n  "name": "a",\n  "version": "1.0.0"\n}\n',
    );
  });

  it('ワークスペースのpackage.jsonやpackagesPathが存在しない場合は例外を投げる', () => {
    expect(() =>
      setVersion('1.0.0', {
        workspacePackageJsonPath: path.join(dir, 'missing.json'),
        packagesPath,
      }),
    ).toThrow('does not exist');
    expect(() =>
      setVersion('1.0.0', {
        workspacePackageJsonPath,
        packagesPath: path.join(dir, 'missing'),
      }),
    ).toThrow('does not exist');
  });
});
