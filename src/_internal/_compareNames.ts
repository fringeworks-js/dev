/**
 * 大文字・小文字を区別せずに比較し、同じ場合は文字コード順で比較する
 * @param a 比較する名前
 * @param b 比較する名前
 */
export default function compareNames(a: string, b: string) {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA !== lowerB) {
    return lowerA < lowerB ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}
