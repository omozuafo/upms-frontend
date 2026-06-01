import { useEffect, useRef } from "react";
import { useRefresh } from "../contexts/RefreshContext";

/**
 * Custom hook to automatically refresh data at a given interval AND on global refresh triggers.
 *
 * @param {Function} callback - The function to call to refresh data.
 * @param {number} intervalMs - The interval in milliseconds (default: 5000).
 */
export default function useAutoRefresh(callback, intervalMs = 0) {
  const savedCallback = useRef(callback);
  const { refreshTrigger } = useRefresh();

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Trigger on global refresh
  useEffect(() => {
    if (savedCallback.current && refreshTrigger > 0) {
      savedCallback.current();
    }
  }, [refreshTrigger]);

  // Set up the interval.
  useEffect(() => {
    // Don't auto-refresh if interval is null or 0
    if (intervalMs === null || intervalMs === 0) {
      return;
    }

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
