/**
 * invertObj - should swap object keys and values
 * @param {object} obj - the initial object
 * @returns {object | undefined} - returns new object or undefined if nothing did't pass
 */
export function invertObj(obj) {
  if (!obj) {
    return obj;
  }
  const entries = [];
  for (const [value, key] of Object.entries(obj)) {
    entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}


