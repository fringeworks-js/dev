import compareNames from './compareNames';

describe('compareNames', () => {
  it('大文字・小文字を区別せずに並べる', () => {
    expect(['c', 'B', 'a'].sort(compareNames)).toEqual(['a', 'B', 'c']);
  });

  it('大文字・小文字だけが異なる場合は文字コード順', () => {
    expect(['a', 'A'].sort(compareNames)).toEqual(['A', 'a']);
    expect(['A', 'a'].sort(compareNames)).toEqual(['A', 'a']);
  });

  it('同じ名前は0', () => {
    expect(compareNames('a', 'a')).toBe(0);
  });
});
