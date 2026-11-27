'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({
  value = 0,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style = {},
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = typeof value === 'number' ? value : parseFloat(value) || 0;
    prevValueRef.current = endVal;

    // If identical, do not animate
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo for high-precision tactile feel
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (endVal - startVal) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  const formatted = Number(displayValue || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        display: 'inline-block',
        ...style,
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
