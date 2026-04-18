const cleanData = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && !Number.isNaN(v))
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return Number.isNaN(obj) ? 0 : obj;
};

const payload = {
    plansArr: [
        { remainingQty: undefined, type: '기간권' }
    ]
};

console.log(JSON.stringify(cleanData(payload)));
