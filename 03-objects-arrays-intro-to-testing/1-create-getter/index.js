/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const sep = ".";
  const props = path.split(sep);
  const reduceCallback = (accumObj, prop) => accumObj?.[prop];
  return (obj) => props.reduce(reduceCallback, obj);
}
