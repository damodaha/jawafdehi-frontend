import { useEffect, useMemo, useState } from "react";

type CountUpValueProps = {
  value: string;
  duration?: number;
};

export function CountUpValue({ value, duration = 900 }: CountUpValueProps) {
  const numericValue = useMemo(() => {
    const normalizedValue = value.replace(/,/g, "");
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) && normalizedValue.trim() !== ""
      ? parsedValue
      : null;
  }, [value]);

  const [displayValue, setDisplayValue] = useState(() => {
    if (numericValue === null) {
      return value;
    }

    return "0";
  });

  useEffect(() => {
    if (numericValue === null) {
      setDisplayValue(value);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(numericValue.toLocaleString());
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const updateValue = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(numericValue * easedProgress);

      setDisplayValue(nextValue.toLocaleString());

      if (progress < 1) {
        frameId = requestAnimationFrame(updateValue);
      }
    };

    frameId = requestAnimationFrame(updateValue);

    return () => cancelAnimationFrame(frameId);
  }, [duration, numericValue, value]);

  return <>{displayValue}</>;
}
