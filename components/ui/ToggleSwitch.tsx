// components/ToggleSwitch.tsx
"use client";
import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;     // default hijau
  inactiveColor?: string;   // default abu-abu
  size?: 'sm' | 'md' | 'lg'; // responsive sizing
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  activeColor = "#16A34A",    // hijau tailwind: green-600
  inactiveColor = "#9CA3AF",  // abu tailwind: gray-400
  size = 'md'
}) => {
  // Responsive sizing classes
  const sizeClasses = {
    sm: 'h-4 w-8',
    md: 'h-6 w-12',
    lg: 'h-8 w-16'
  };

  const knobSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5', 
    lg: 'h-7 w-7'
  };

  const translateDistance = {
    sm: 'translateX(100%)',
    md: 'translateX(120%)',
    lg: 'translateX(114%)'
  };
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${sizeClasses[size]}`}
      style={{
        backgroundColor: checked ? activeColor : inactiveColor,
      }}
      aria-pressed={checked}
      aria-label={checked ? "Turn off" : "Turn on"}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-md transition-all duration-200 ${knobSizeClasses[size]}`}
        style={{
          transform: checked ? translateDistance[size] : "translateX(0%)",
        }}
      />
    </button>
  );
};

export default ToggleSwitch;