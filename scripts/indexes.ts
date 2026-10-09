import generateIndexFiles from '../src/generateIndexFiles';
import {
  CONSTANTS,
  PRIVATE,
  TEST_FILE,
} from '../src/generateIndexFiles/constants';

generateIndexFiles({
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
