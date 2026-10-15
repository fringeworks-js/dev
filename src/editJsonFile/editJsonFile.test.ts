import path from 'path';
import { createTempDir, readFile, removeTempDir } from '../../test/tempDir';
import editJsonFile from './editJsonFile';

describe('editJsonFile', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = createTempDir({
      'a.json': JSON.stringify({
        name: 'a',
        scripts: { build: 'x', dev: 'y' },
      }),
    });
    file = path.join(dir, 'a.json');
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  it('関数の戻り値で置き換え、インデント2つで書き込む', () => {
    editJsonFile(file, ({ scripts, ...rest }) => rest);
    expect(readFile(dir, 'a.json')).toBe('{\n  "name": "a"\n}\n');
  });

  it('オブジェクトは浅くマージする', () => {
    editJsonFile(file, { private: true, scripts: { test: 'z' } });
    expect(JSON.parse(readFile(dir, 'a.json'))).toEqual({
      name: 'a',
      private: true,
      scripts: { test: 'z' },
    });
  });

  it('ファイルが存在しない場合は例外を投げる', () => {
    expect(() => editJsonFile(path.join(dir, 'missing.json'), {})).toThrow(
      'does not exist',
    );
  });
});
