export const DEMO_SANDBOX_PREFIX = 'jacs_demo_sandbox_';
export const DEMO_SANDBOX_INIT_FLAG = 'jacs_demo_sandbox_initialized_v1';
export const DEMO_SANDBOX_ACTIVE_FLAG = 'jacs_demo_sandbox_active_v1';
export const DEMO_SANDBOX_ACTIVE_USER_KEY = 'jacs_demo_sandbox_active_user';
export const DEMO_SANDBOX_SESSION_SIG_KEY = 'jacs_demo_sandbox_session_sig';

export interface DemoDivisionQuickPin {
  id: 'pos' | 'executive' | 'finance' | 'purchasing' | 'warehouse' | 'hr';
  label: string;
  username: string;
  pin: string;
  accentHex: string;
}

export const DEMO_DIVISION_QUICK_PINS: DemoDivisionQuickPin[] = [
  { id: 'pos', label: 'Kasir POS', username: 'Kasir 01', pin: '1101', accentHex: '#F43F5E' },
  { id: 'executive', label: 'Executive', username: 'Executive', pin: '1234', accentHex: '#3B82F6' },
  { id: 'finance', label: 'Finance', username: 'Finance', pin: '1234', accentHex: '#22C55E' },
  { id: 'purchasing', label: 'Purchasing', username: 'Purchasing', pin: '1234', accentHex: '#F97316' },
  { id: 'warehouse', label: 'Warehouse', username: 'Gudang', pin: '1234', accentHex: '#06B6D4' },
  { id: 'hr', label: 'HR', username: 'HR', pin: '1234', accentHex: '#A855F7' },
];

export const isDemoSandboxActive = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DEMO_SANDBOX_ACTIVE_FLAG) === 'true' || sessionStorage.getItem(DEMO_SANDBOX_ACTIVE_FLAG) === 'true';
  } catch {
    return false;
  }
};

export const isDemoSandboxMode = (): boolean => isDemoSandboxActive();

export const activateDemoSandbox = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEMO_SANDBOX_ACTIVE_FLAG, 'true');
    sessionStorage.setItem(DEMO_SANDBOX_ACTIVE_FLAG, 'true');
  } catch {}
};

export const deactivateDemoSandbox = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DEMO_SANDBOX_ACTIVE_FLAG);
    sessionStorage.removeItem(DEMO_SANDBOX_ACTIVE_FLAG);
    clearAllDemoSandboxStorage();
  } catch {}
};

export const getActiveStorageBackend = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return isDemoSandboxActive() ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};

export const getScopedStoragePrefix = (productionPrefix = 'jacs_retailos_erp_v2_2_'): string =>
  isDemoSandboxActive() ? DEMO_SANDBOX_PREFIX : productionPrefix;

export const sandboxGetItem = (key: string): string | null => {
  try {
    const store = getActiveStorageBackend();
    return store ? store.getItem(key) : null;
  } catch {
    return null;
  }
};

export const sandboxSetItem = (key: string, value: string): void => {
  try {
    const store = getActiveStorageBackend();
    if (store) store.setItem(key, value);
  } catch {}
};

export const sandboxRemoveItem = (key: string): void => {
  try {
    const store = getActiveStorageBackend();
    if (store) store.removeItem(key);
  } catch {}
};

export const clearAllDemoSandboxStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    const stores: Storage[] = [];
    if (window.sessionStorage) stores.push(window.sessionStorage);
    if (window.localStorage) stores.push(window.localStorage);

    stores.forEach((store) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith(DEMO_SANDBOX_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          store.removeItem(k);
        } catch {}
      });
    });
  } catch {}
};
