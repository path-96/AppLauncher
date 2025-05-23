
import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    // If no item or error, set initial value in localStorage as a side-effect
    // This ensures that on first load with an empty LS, it gets populated.
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(key, JSON.stringify(initialValue));
        } catch (error) {
            console.warn(`Error setting initial localStorage key "${key}":`, error);
        }
    }
    return initialValue;
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const serializedState = JSON.stringify(storedValue);
      // Update localStorage only if the value has actually changed from what's currently in localStorage
      // or if localStorage doesn't have this key yet (e.g. after readValue initialized it without finding it)
      if (window.localStorage.getItem(key) !== serializedState) {
        window.localStorage.setItem(key, serializedState);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn(`Error parsing storage event value for key "${key}":`, error);
          }
        } else { // Item was removed or cleared from another tab
          setStoredValue(initialValue);
           // Optionally re-populate localStorage with initialValue if it was cleared
          if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(key, JSON.stringify(initialValue));
            } catch (e) {
                console.warn(`Error re-setting initial localStorage key "${key}" after external clear:`, e);
            }
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
