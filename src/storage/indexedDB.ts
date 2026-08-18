import {
  UserProfile,
  VO2TestRecord,
  TrainingPlan,
  WorkoutLog,
  CheckInAssessment,
  AppSettings,
} from '../types';

const DB_NAME = 'MinhaAssessoriaDB';
const DB_VERSION = 1;

export const STORES = {
  PROFILE: 'user_profile',
  VO2_TESTS: 'vo2_tests',
  TRAINING_PLAN: 'training_plan',
  WORKOUT_LOGS: 'workout_logs',
  CHECK_INS: 'check_ins',
  SETTINGS: 'settings',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.VO2_TESTS)) {
        const testStore = db.createObjectStore(STORES.VO2_TESTS, { keyPath: 'id' });
        testStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.TRAINING_PLAN)) {
        db.createObjectStore(STORES.TRAINING_PLAN, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.WORKOUT_LOGS)) {
        const logStore = db.createObjectStore(STORES.WORKOUT_LOGS, { keyPath: 'id' });
        logStore.createIndex('date', 'date', { unique: false });
        logStore.createIndex('workoutId', 'workoutId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.CHECK_INS)) {
        const checkStore = db.createObjectStore(STORES.CHECK_INS, { keyPath: 'id' });
        checkStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// LocalStorage Keys for instant sync & offline redundancy
const LS_KEYS = {
  PROFILE: 'MA_USER_PROFILE_V1',
  PLAN: 'MA_ACTIVE_PLAN_V1',
  VO2_TESTS: 'MA_VO2_TESTS_V1',
  LOGS: 'MA_WORKOUT_LOGS_V1',
  CHECK_INS: 'MA_CHECK_INS_V1',
  SETTINGS: 'MA_APP_SETTINGS_V1',
};

function safeSetLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write warning:', e);
  }
}

function safeGetLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('LocalStorage read warning:', e);
    return null;
  }
}

function safeRemoveLS(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('LocalStorage remove warning:', e);
  }
}

// ----------------- PROFILE -----------------
export async function saveProfile(profile: UserProfile): Promise<void> {
  // Always mirror immediately to LocalStorage
  safeSetLS(LS_KEYS.PROFILE, profile);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROFILE, 'readwrite');
      const store = tx.objectStore(STORES.PROFILE);
      store.put(profile);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn('IndexedDB write error, saved to LocalStorage:', tx.error);
        resolve(); // resolve because LS is already saved
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, profile persisted via LocalStorage:', err);
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const db = await getDB();
    const idbProfile = await new Promise<UserProfile | null>((resolve, reject) => {
      const tx = db.transaction(STORES.PROFILE, 'readonly');
      const store = tx.objectStore(STORES.PROFILE);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as UserProfile[];
        resolve(results.length > 0 ? results[0] : null);
      };
      req.onerror = () => reject(req.error);
    });

    if (idbProfile) {
      safeSetLS(LS_KEYS.PROFILE, idbProfile);
      return idbProfile;
    }
  } catch (err) {
    console.warn('IndexedDB getProfile error, falling back to LocalStorage:', err);
  }

  // Fallback to LocalStorage
  const lsProfile = safeGetLS<UserProfile>(LS_KEYS.PROFILE);
  if (lsProfile) {
    // Quietly restore back to IndexedDB
    try {
      const db = await getDB();
      const tx = db.transaction(STORES.PROFILE, 'readwrite');
      tx.objectStore(STORES.PROFILE).put(lsProfile);
    } catch {}
    return lsProfile;
  }

  return null;
}

// ----------------- VO2 TESTS -----------------
export async function saveVO2Test(test: VO2TestRecord): Promise<void> {
  // Update LocalStorage mirror
  const currentTests = safeGetLS<VO2TestRecord[]>(LS_KEYS.VO2_TESTS) || [];
  const updatedTests = [...currentTests.filter((t) => t.id !== test.id), test];
  safeSetLS(LS_KEYS.VO2_TESTS, updatedTests);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.VO2_TESTS, 'readwrite');
      const store = tx.objectStore(STORES.VO2_TESTS);
      store.put(test);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB saveVO2Test fallback to LocalStorage:', err);
  }
}

export async function getAllVO2Tests(): Promise<VO2TestRecord[]> {
  try {
    const db = await getDB();
    const idbTests = await new Promise<VO2TestRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORES.VO2_TESTS, 'readonly');
      const store = tx.objectStore(STORES.VO2_TESTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as VO2TestRecord[]).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });

    if (idbTests && idbTests.length > 0) {
      safeSetLS(LS_KEYS.VO2_TESTS, idbTests);
      return idbTests;
    }
  } catch (err) {
    console.warn('IndexedDB getAllVO2Tests error, fallback to LS:', err);
  }

  return safeGetLS<VO2TestRecord[]>(LS_KEYS.VO2_TESTS) || [];
}

export async function getLatestVO2Test(): Promise<VO2TestRecord | null> {
  const tests = await getAllVO2Tests();
  return tests.length > 0 ? tests[tests.length - 1] : null;
}

// ----------------- TRAINING PLAN -----------------
export async function saveTrainingPlan(plan: TrainingPlan): Promise<void> {
  safeSetLS(LS_KEYS.PLAN, plan);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRAINING_PLAN, 'readwrite');
      const store = tx.objectStore(STORES.TRAINING_PLAN);
      store.put(plan);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB saveTrainingPlan fallback to LocalStorage:', err);
  }
}

export async function getTrainingPlan(): Promise<TrainingPlan | null> {
  try {
    const db = await getDB();
    const idbPlan = await new Promise<TrainingPlan | null>((resolve, reject) => {
      const tx = db.transaction(STORES.TRAINING_PLAN, 'readonly');
      const store = tx.objectStore(STORES.TRAINING_PLAN);
      const req = store.getAll();
      req.onsuccess = () => {
        const plans = req.result as TrainingPlan[];
        resolve(plans.length > 0 ? plans[plans.length - 1] : null);
      };
      req.onerror = () => reject(req.error);
    });

    if (idbPlan) {
      safeSetLS(LS_KEYS.PLAN, idbPlan);
      return idbPlan;
    }
  } catch (err) {
    console.warn('IndexedDB getTrainingPlan error, fallback to LS:', err);
  }

  const lsPlan = safeGetLS<TrainingPlan>(LS_KEYS.PLAN);
  if (lsPlan) {
    try {
      const db = await getDB();
      const tx = db.transaction(STORES.TRAINING_PLAN, 'readwrite');
      tx.objectStore(STORES.TRAINING_PLAN).put(lsPlan);
    } catch {}
    return lsPlan;
  }

  return null;
}

export const getActivePlan = getTrainingPlan;
export const saveActivePlan = saveTrainingPlan;

// ----------------- WORKOUT LOGS -----------------
export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  const currentLogs = safeGetLS<WorkoutLog[]>(LS_KEYS.LOGS) || [];
  const updatedLogs = [...currentLogs.filter((l) => l.id !== log.id), log];
  safeSetLS(LS_KEYS.LOGS, updatedLogs);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_LOGS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_LOGS);
      store.put(log);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB saveWorkoutLog fallback to LocalStorage:', err);
  }
}

export async function getAllWorkoutLogs(): Promise<WorkoutLog[]> {
  try {
    const db = await getDB();
    const idbLogs = await new Promise<WorkoutLog[]>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_LOGS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_LOGS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result as WorkoutLog[]);
      };
      req.onerror = () => reject(req.error);
    });

    if (idbLogs && idbLogs.length > 0) {
      safeSetLS(LS_KEYS.LOGS, idbLogs);
      return idbLogs;
    }
  } catch (err) {
    console.warn('IndexedDB getAllWorkoutLogs error, fallback to LS:', err);
  }

  return safeGetLS<WorkoutLog[]>(LS_KEYS.LOGS) || [];
}

// ----------------- CHECK-INS -----------------
export async function saveCheckIn(checkIn: CheckInAssessment): Promise<void> {
  const currentCheckIns = safeGetLS<CheckInAssessment[]>(LS_KEYS.CHECK_INS) || [];
  const updatedCheckIns = [...currentCheckIns.filter((c) => c.id !== checkIn.id), checkIn];
  safeSetLS(LS_KEYS.CHECK_INS, updatedCheckIns);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CHECK_INS, 'readwrite');
      const store = tx.objectStore(STORES.CHECK_INS);
      store.put(checkIn);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB saveCheckIn fallback to LocalStorage:', err);
  }
}

export async function getTodayCheckIn(): Promise<CheckInAssessment | null> {
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const db = await getDB();
    const idbCheckIn = await new Promise<CheckInAssessment | null>((resolve, reject) => {
      const tx = db.transaction(STORES.CHECK_INS, 'readonly');
      const store = tx.objectStore(STORES.CHECK_INS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as CheckInAssessment[];
        const todayMatch = list.find((c) => c.date === todayStr);
        resolve(todayMatch ?? null);
      };
      req.onerror = () => reject(req.error);
    });

    if (idbCheckIn) {
      return idbCheckIn;
    }
  } catch (err) {
    console.warn('IndexedDB getTodayCheckIn error, fallback to LS:', err);
  }

  const lsCheckIns = safeGetLS<CheckInAssessment[]>(LS_KEYS.CHECK_INS) || [];
  return lsCheckIns.find((c) => c.date === todayStr) || null;
}

// ----------------- SETTINGS -----------------
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = {
    audioCues: true,
    vibration: true,
    autoSaveIntervalSec: 10,
  };

  try {
    const db = await getDB();
    const idbSettings = await new Promise<AppSettings>((resolve) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('app_settings');
      req.onsuccess = () => {
        resolve(req.result?.data ?? defaultSettings);
      };
      req.onerror = () => resolve(defaultSettings);
    });
    return idbSettings;
  } catch {
    return safeGetLS<AppSettings>(LS_KEYS.SETTINGS) || defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  safeSetLS(LS_KEYS.SETTINGS, settings);
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = tx.objectStore(STORES.SETTINGS);
      store.put({ id: 'app_settings', data: settings });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ----------------- FULL BACKUP / RESTORE / RESET -----------------
export async function exportAllData() {
  const profile = await getProfile();
  const tests = await getAllVO2Tests();
  const plan = await getTrainingPlan();
  const logs = await getAllWorkoutLogs();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    tests,
    plan,
    logs,
  };
}

export async function importAllData(data: any): Promise<void> {
  if (data.profile) await saveProfile(data.profile);
  if (Array.isArray(data.tests)) {
    for (const t of data.tests) await saveVO2Test(t);
  }
  if (data.plan) await saveTrainingPlan(data.plan);
  if (Array.isArray(data.logs)) {
    for (const l of data.logs) await saveWorkoutLog(l);
  }
}

export async function clearAllLocalData(): Promise<void> {
  // Clear LocalStorage mirrors
  safeRemoveLS(LS_KEYS.PROFILE);
  safeRemoveLS(LS_KEYS.PLAN);
  safeRemoveLS(LS_KEYS.VO2_TESTS);
  safeRemoveLS(LS_KEYS.LOGS);
  safeRemoveLS(LS_KEYS.CHECK_INS);
  safeRemoveLS(LS_KEYS.SETTINGS);

  try {
    const db = await getDB();
    const storeNames = [
      STORES.PROFILE,
      STORES.VO2_TESTS,
      STORES.TRAINING_PLAN,
      STORES.WORKOUT_LOGS,
      STORES.CHECK_INS,
      STORES.SETTINGS,
    ];

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB clearAllLocalData error:', err);
  }
}
