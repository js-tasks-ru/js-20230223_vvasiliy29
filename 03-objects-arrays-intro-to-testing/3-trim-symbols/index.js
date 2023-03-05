/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (!size) {
    return size === 0 ? '' : string;
  }
  let currentLatter = '';
  let count = 0;
  return string.split('').filter((latter) => {
    count = currentLatter !== latter ? 1 : count + 1;
    currentLatter = latter;
    return count <= size;
  }).join('');
}
