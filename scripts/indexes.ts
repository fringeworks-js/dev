import fs from 'fs';
import * as prettier from 'prettier';
import generateIndexFiles from '../src/generateIndexFiles';
import {
  CONSTANTS,
  PRIVATE,
  TEST_FILE,
} from '../src/generateIndexFiles/constants';

const indexPaths = generateIndexFiles({
  exclude: [
    CONSTANTS,
    PRIVATE,
    TEST_FILE,
    {
      valueType: 'path',
      conditions: /\/_internal\/.+/,
    },
  ],
});

// 作成したindexファイルをPrettierで整形
for (const indexPath of indexPaths) {
  const options = await prettier.resolveConfig(indexPath);
  const source = fs.readFileSync(indexPath, 'utf8');
  const formatted = await prettier.format(source, {
    ...options,
    filepath: indexPath,
  });
  fs.writeFileSync(indexPath, formatted);
}
