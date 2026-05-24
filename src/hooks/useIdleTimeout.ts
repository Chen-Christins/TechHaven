import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];

export function useIdleTimeout(timeoutHours: number, onTimeout: () => void, enabled: boolean): void {
  const lastActivityRef = useRef(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled || timeoutHours <= 0) return;

    // Reset timer on mount
    lastActivityRef.current = Date.now();

    // Listen for activity
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Check every 60 seconds
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const timeoutMs = timeoutHours * 60 * 60 * 1000;

      if (idleMs >= timeoutMs) {
        onTimeoutRef.current();
        lastActivityRef.current = Date.now();
      }
    }, 60000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [timeoutHours, enabled, resetTimer]);
}
