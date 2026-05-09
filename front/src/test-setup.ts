import '@testing-library/jest-dom/vitest';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

const needsLocalStoragePolyfill =
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.clear !== 'function';
if (needsLocalStoragePolyfill) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}

const needsSessionStoragePolyfill =
  typeof globalThis.sessionStorage === 'undefined' ||
  typeof globalThis.sessionStorage.clear !== 'function';
if (needsSessionStoragePolyfill) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}

if (typeof window !== 'undefined') {
  if (
    typeof window.localStorage === 'undefined' ||
    typeof window.localStorage.clear !== 'function'
  ) {
    Object.defineProperty(window, 'localStorage', {
      value: globalThis.localStorage,
      configurable: true,
      writable: true,
    });
  }
  if (
    typeof window.sessionStorage === 'undefined' ||
    typeof window.sessionStorage.clear !== 'function'
  ) {
    Object.defineProperty(window, 'sessionStorage', {
      value: globalThis.sessionStorage,
      configurable: true,
      writable: true,
    });
  }
}
