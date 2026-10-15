import path from 'path';
import { createTempDir, removeTempDir } from '../../test/tempDir';
import checkExistence from './checkExistence';

describe('checkExistence', () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir({ 'a.ts': '' });
  });

  afterEach(() => {
    removeTempDir(dir);
    vi.restoreAllMocks();
  });

  it('すべて存在すればtrue', () => {
    expect(checkExistence(dir, path.join(dir, 'a.ts'))).toBe(true);
  });

  it('存在しないパスがあればエラーを出力してfalse', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const missing = path.join(dir, 'missing');
    expect(checkExistence(dir, missing)).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining(missing));
  });
});
