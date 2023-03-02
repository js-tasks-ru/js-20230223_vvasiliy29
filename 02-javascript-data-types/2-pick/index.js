/**
 * pick - Creates an object composed of the picked object properties:
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to pick
 * @returns {object} - returns the new object
 */
export const pick = (obj, ...fields) => {
  const pick = {};
  for (let key in fields) {
    if (fields[key] in obj) {
      let field = fields[key];
      pick[field] = obj[field]
    }
  }
  return pick;
};

