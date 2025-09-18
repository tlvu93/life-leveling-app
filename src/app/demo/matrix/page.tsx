"use client";

import React, { useState } from "react";
import ResponsiveLifeStatMatrix from "@/components/ResponsiveLifeStatMatrix";
import TimeBasedMatrixComparison from "@/components/TimeBasedMatrixComparison";
import { LifeStatMatrixData, RadarChartData } from "@/types";
import { generateSampleLifeStatData } from "@/lib/chart-utils";

export default function MatrixDemoPage() {
  const [matrixData, setMatrixData] = useState<LifeStatMatrixData>(
    generateSampleLifeStatData()
  );
  const [showHistorical, setShowHistorical] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const handleSkillClick = (skill: string) => {
    alert(
      `Clicked on ${skill}! In a real app, this would open detailed skill information.`
    );
  };

  const regenerateData = () => {
    setMatrixData(generateSampleLifeStatData());
    setAnimationKey((prev) => prev + 1); // Force re-render with animation
  };

  const updateSkillLevel = (skillIndex: number, newLevel: number) => {
    const newData = { ...matrixData };
    newData.current[skillIndex].value = newLevel;
    setMatrixData(newData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LifeStat Matrix Demo 📊
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Interactive demonstration of the radar chart visualization
            component. Try clicking on skills, toggling historical view, and
            adjusting skill levels.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Demo Controls
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={regenerateData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🎲 Generate New Data
            </button>
            <button
              onClick={() => setShowHistorical(!showHistorical)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showHistorical
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {showHistorical ? "👁️ Hide Historical" : "📈 Show Historical"}
            </button>
          </div>
        </div>

        {/* Main Matrix Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <ResponsiveLifeStatMatrix
            key={animationKey}
            data={matrixData}
            onSkillClick={handleSkillClick}
            showHistorical={showHistorical}
          />
        </div>

        {/* Advanced Time-Based Comparison Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Advanced Time-Based Comparison
          </h2>
          <TimeBasedMatrixComparison
            key={animationKey + 1000}
            data={matrixData}
            onSkillClick={handleSkillClick}
          />
        </div>

        {/* Skill Level Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Adjust Skill Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matrixData.current.map((skill, index) => (
              <div key={skill.skill} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  {skill.skill}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Level:</span>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={skill.value}
                    onChange={(e) =>
                      updateSkillLevel(index, parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {skill.value}/4
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {
                    ["", "Novice", "Intermediate", "Advanced", "Expert"][
                      skill.value
                    ]
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Features Implemented
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ D3.js radar chart with TypeScript</li>
                <li>✅ Interactive SVG-based visualization</li>
                <li>✅ Smooth animations for level changes</li>
                <li>✅ Responsive design (mobile & desktop)</li>
                <li>✅ Historical data overlay</li>
                <li>✅ Interactive tooltips and hover effects</li>
                <li>
                  ✅ Accessibility features (ARIA labels, keyboard navigation)
                </li>
                <li>✅ Click handlers for skill selection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Structure</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(
                  {
                    current: matrixData.current.map((skill) => ({
                      skill: skill.skill,
                      value: skill.value,
                      maxValue: skill.maxValue,
                    })),
                    historical: showHistorical ? "Available" : "Hidden",
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
