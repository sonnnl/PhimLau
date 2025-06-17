import { useState, useEffect } from "react";

/**
 * Custom hook để debounce một giá trị
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay (milliseconds)
 * @returns {any} Giá trị đã được debounce
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function để clear timeout nếu value thay đổi
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
