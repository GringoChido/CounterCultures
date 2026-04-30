"use client";

import { useState, useEffect } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  step?: number;
  currency?: string;
}

const PriceRangeSlider = ({
  min,
  max,
  value,
  onChange,
  step = 100,
  currency = "MXN",
}: PriceRangeSliderProps) => {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(parseInt(e.target.value, 10), localMax - step);
    setLocalMin(newMin);
    onChange([newMin, localMax]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value, 10), localMin + step);
    setLocalMax(newMax);
    onChange([localMin, newMax]);
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="relative h-1 bg-brand-stone/20 rounded-full">
        <div
          className="absolute h-full bg-brand-terracotta rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-1 top-0 appearance-none bg-transparent cursor-pointer accent-brand-terracotta pointer-events-none"
          style={{
            zIndex: localMin > max - (max - min) / 3 ? 5 : 3,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1 top-0 appearance-none bg-transparent cursor-pointer accent-brand-terracotta pointer-events-none"
          style={{
            zIndex: 4,
          }}
        />
      </div>

      <style jsx>{`
        input[type="range"] {
          pointer-events: auto;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #C4725A;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #C4725A;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block font-mono text-xs text-brand-stone uppercase tracking-wide">
            Mínimo
          </label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => {
              const val = Math.min(parseInt(e.target.value, 10), localMax);
              setLocalMin(val);
              onChange([val, localMax]);
            }}
            className="w-full px-3 py-2 border border-brand-stone/30 rounded-sm font-mono text-sm focus:border-brand-terracotta focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block font-mono text-xs text-brand-stone uppercase tracking-wide">
            Máximo
          </label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => {
              const val = Math.max(parseInt(e.target.value, 10), localMin);
              setLocalMax(val);
              onChange([localMin, val]);
            }}
            className="w-full px-3 py-2 border border-brand-stone/30 rounded-sm font-mono text-sm focus:border-brand-terracotta focus:outline-none"
          />
        </div>
      </div>

      <p className="font-mono text-xs text-brand-stone">
        ${localMin.toLocaleString()} - ${localMax.toLocaleString()} {currency}
      </p>
    </div>
  );
};

export { PriceRangeSlider };
