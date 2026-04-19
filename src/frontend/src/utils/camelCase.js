const toCamel = (s) => s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const toSnake = (s) => s.replace(/([A-Z])/g, '_$1').toLowerCase();

const transform = (obj, keyFn) => {
    if (Array.isArray(obj)) return obj.map((item) => transform(item, keyFn));
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [keyFn(k), transform(v, keyFn)]));
    }
    return obj;
};

export const keysToCamel = (obj) => transform(obj, toCamel);
export const keysToSnake = (obj) => transform(obj, toSnake);
