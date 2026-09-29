import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatAsINR?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = "",
  suffix = "",
  className = "",
  formatAsINR = false,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const currentValRef = useRef<number>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !spanRef.current) {
      if (spanRef.current) {
        spanRef.current.textContent = formatAsINR
          ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
          : `${prefix}${value.toLocaleString()}${suffix}`;
      }
      currentValRef.current = value;
      return;
    }

    const obj = { val: currentValRef.current };

    const anim = gsap.to(obj, {
      val: value,
      duration: 0.65,
      ease: "power2.out",
      onUpdate: () => {
        if (spanRef.current) {
          const rounded = Math.round(obj.val);
          spanRef.current.textContent = formatAsINR
            ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rounded)
            : `${prefix}${rounded.toLocaleString()}${suffix}`;
        }
      },
      onComplete: () => {
        currentValRef.current = value;
      },
    });

    return () => {
      anim.kill();
    };
  }, [value, prefix, suffix, formatAsINR]);

  const initialFormatted = formatAsINR
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
    : `${prefix}${value.toLocaleString()}${suffix}`;

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`}>
      {initialFormatted}
    </span>
  );
};
