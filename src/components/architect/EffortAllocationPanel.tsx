"use client";

import { useState, useEffect } from "react";
import { Interest, getSkillLevelName, getCommitmentLevelName } from "@/types";

interface EffortAllocationPanelProps {
  interests: Interest[];
  effortAllocation: Record<string, number>;
  onEffortChange: (category: string, effort: number) => void;
}

export default function EffortAllocationPanel({
  interests,
  effortAllocation,
  onEffortChange,
}: EffortAllocationPanelProps) {
  const [totalEffort, setTotalEffort] = useState(0);
  const [isBalancing, setIsBalancing] = useState(false);

  useEffect(() => {
    const total = Object.values(effortAllocation).reduce(
      (sum, effort) => sum + effort,
      0
    );
    setTotalEffort(total);
  }, [effortAllocation]);

  const handleSliderChange = (category: string, newEffort: number) => {
    onEffortChange(category, newEffort);
  };

  const balanceEffort = () => {
    setIsBalancing(true);
    const equalEffort = Math.floor(100 / interests.length);
    let remainingEffort = 100;

    interests.forEach((interest, index) => {
      if (index === interests.length - 1) {
        onEffortChange(interest.category, remainingEffort);
      } else {
        onEffortChange(interest.category, equalEffort);
        remainingEffort -= equalEffort;
      }
    });

    setTimeout(() => setIsBalancing(false), 300);
  };

  const resetToCommitmentLevels = () => {
    const commitmentWeights = {
      casual: 1,
      average: 2,
      invested: 3,
      competitive: 4,
    };

    const totalWeight = interests.reduce(
      (sum, interest) => sum + commitmentWeights[interest.intentLevel],
      0
    );

    interests.forEach((interest) => {
      const weight = commitmentWeights[interest.intentLevel];
      const effort = Math.round((weight / totalWeight) * 100);
      onEffortChange(interest.category, effort);
    });
  };

  const getEffortColor = (effort: number) => {
    if (effort < 10) return "bg-gray-200";
    if (effort < 20) return "bg-blue-200";
    if (effort < 30) return "bg-green-200";
    if (effort < 40) return "bg-yellow-200";
    return "bg-red-200";
  };

  const getEffortTextColor = (effort: number) => {
    if (effort < 10) return "text-gray-600";
    if (effort < 20) return "text-blue-600";
    if (effort < 30) return "text-green-600";
    if (effort < 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          ⚡ Effort Allocation
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            totalEffort === 100
              ? "bg-green-100 text-green-800"
              : totalEffort > 100
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {totalEffort}%
        </div>
      </div>

      <div className="space-y-6">
        {interests.map((interest) => {
          const effort = effortAllocation[interest.category] || 0;

          return (
            <div key={interest.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {interest.category}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{getSkillLevelName(interest.currentLevel)}</span>
                    <span>•</span>
                    <span>{getCommitmentLevelName(interest.intentLevel)}</span>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-sm font-medium ${getEffortColor(
                    effort
                  )} ${getEffortTextColor(effort)}`}
                >
                  {effort}%
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effort}
                  onChange={(e) =>
                    handleSliderChange(
                      interest.category,
                      Number(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${effort}%, #e5e7eb ${effort}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={balanceEffort}
            disabled={isBalancing}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isBalancing ? "Balancing..." : "Equal Split"}
          </button>
          <button
            onClick={resetToCommitmentLevels}
            className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            By Commitment
          </button>
        </div>

        {totalEffort !== 100 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {totalEffort > 100
                ? `Over-allocated by ${
                    totalEffort - 100
                  }%. Reduce some efforts.`
                : `Under-allocated by ${100 - totalEffort}%. Add more effort.`}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
