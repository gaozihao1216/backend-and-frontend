const DB_NAME = "ugc-level-platform-visual-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

type VisualAssetRecord = {
  id: string;
  sourceDataUrl: string;
  updatedAt: number;
};

const memoryCache = new Map<string, string>();

const canUseIndexedDb = () => typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("当前环境不支持 IndexedDB。"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打开 IndexedDB 失败。"));
  });

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = handler(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB 操作失败。"));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB 事务失败。"));
  });
};

export const getCachedVisualAsset = (assetId: string): string | null =>
  memoryCache.get(assetId) ?? null;

export const saveVisualAsset = async (assetId: string, sourceDataUrl: string): Promise<void> => {
  if (!assetId || !sourceDataUrl) {
    return;
  }

  memoryCache.set(assetId, sourceDataUrl);

  if (!canUseIndexedDb()) {
    return;
  }

  const record: VisualAssetRecord = {
    id: assetId,
    sourceDataUrl,
    updatedAt: Date.now(),
  };

  await runTransaction("readwrite", (store) => store.put(record));
};

export const loadVisualAsset = async (assetId: string): Promise<string | null> => {
  if (!assetId) {
    return null;
  }

  const cached = memoryCache.get(assetId);
  if (cached) {
    return cached;
  }

  if (!canUseIndexedDb()) {
    return null;
  }

  const record = await runTransaction<VisualAssetRecord | undefined>("readonly", (store) => store.get(assetId));
  if (!record?.sourceDataUrl) {
    return null;
  }

  memoryCache.set(assetId, record.sourceDataUrl);
  return record.sourceDataUrl;
};

export const preloadVisualAssets = async (assetIds: string[]): Promise<void> => {
  await Promise.all(assetIds.map((assetId) => loadVisualAsset(assetId)));
};
