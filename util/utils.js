
function replaceProperty(obj, oldProperty, newProperty) {
  if (obj[oldProperty]) {
    obj[newProperty] = obj[oldProperty];
    delete obj[oldProperty];
  }
  return obj;
}

function formatText(string) {
  return string.toLowerCase().split('_').map(e => e[0].toUpperCase() + e.substr(1)).join(' ');
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function calculateMissingValues(points) {
  points = JSON.parse(JSON.stringify(points));
  const getNextPoint = (array, index) => {
    for (let j = index + 1; j < array.length; j++) {
      if (null !== array[j]) {
        return j;
      }
    }
  };

  let i = points.findIndex(e => null !== e);
  for (; i < points.length; i++) {
    if (null === points[i]) {
      let next = getNextPoint(points, i);
      if (next) {
        const d = next - (i - 1);
        points[i] = (points[next] - (points[i - 1] || 0)) / d;
        points[i] += (points[i - 1] || 0);
      }
    }
  }
  return points;
}

function fillMissingValues(data, ...keys) {
  const fillings = keys.map(key => {
    return calculateMissingValues(data.map(e => e[key]));
  });
  data.forEach((e, i) => {
    keys.forEach((key, keyIndex) => {
      if (isNullOrUndefined(e[key]) && !isNullOrUndefined(fillings[keyIndex][i])) {
        e[key] = +fillings[keyIndex][i].toFixed(2);
        e[`is${capitalizeFirstLetter(key)}Calculated`] = true;
      }
    });
  });
}

function isNullOrUndefined(value) {
  return null === value || undefined === value;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerizeFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function getRandomValueArray(arr, n) {
  let result = new Array(n),
      len = arr.length,
      taken = new Array(len);
  if (n > len)
      throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
      let x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

module.exports = {
  replaceProperty,
  formatText,
  sleep,
  calculateMissingValues,
  fillMissingValues,
  isNullOrUndefined,
  capitalizeFirstLetter,
  lowerizeFirstLetter,
  getRandomValueArray
};
