"use client";

import { useState } from "react";
import { SimulationScenario } from "@/types";

interface ScenarioManagerProps {
  currentScenario: SimulationScenario | null;
  savedScenarios: SimulationScenario[];
  onSaveScenario: (scenarioName: string) => void;
  onLoadScenario: (scenario: SimulationScenario) => void;
  onConvertToGoals: () => void;
  onCompareScenarios?: () => void;
}

export default function ScenarioManager({
  currentScenario,
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  onConvertToGoals,
  onCompareScenarios,
}: ScenarioManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [showScenarioList, setShowScenarioList] = useState(false);

  const handleSave = () => {
    if (scenarioName.trim()) {
      onSaveScenario(scenarioName.trim());
      setScenarioName("");
      setShowSaveDialog(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScenarioSummary = (scenario: SimulationScenario) => {
    const efforts = Object.entries(scenario.effortAllocation);
    const topEffort = efforts.reduce(
      (max, [skill, effort]) => (effort > max.effort ? { skill, effort } : max),
      { skill: "", effort: 0 }
    );

    return `${topEffort.skill} (${topEffort.effort}%) • ${scenario.timeframeWeeks}w`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">💾 Scenario Manager</h3>
        <div className="text-sm text-gray-500">
          {savedScenarios.length} saved
        </div>
      </div>

      {/* Current Scenario Info */}
      {currentScenario && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-purple-900">
              Current: {currentScenario.scenarioName}
            </h4>
            <div className="text-sm text-purple-600">
              {formatDate(currentScenario.createdAt)}
            </div>
          </div>
          <p className="text-sm text-purple-700">
            {getScenarioSummary(currentScenario)}
          </p>
          {!currentScenario.isConvertedToGoals && (
            <button
              onClick={onConvertToGoals}
              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              🎯 Convert to Goals
            </button>
          )}
          {currentScenario.isConvertedToGoals && (
            <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium inline-block">
              ✅ Converted to Goals
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          💾 Save Current Scenario
        </button>

        <button
          onClick={() => setShowScenarioList(!showScenarioList)}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          📋 {showScenarioList ? "Hide" : "Show"} Saved Scenarios
        </button>

        {savedScenarios.length >= 2 && onCompareScenarios && (
          <button
            onClick={onCompareScenarios}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            📊 Compare Scenarios
          </button>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Save Scenario</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Enter scenario name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!scenarioName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setScenarioName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      {showScenarioList && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Saved Scenarios</h4>

          {savedScenarios.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No saved scenarios yet</p>
              <p className="text-sm">
                Save your current allocation to compare later
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    currentScenario?.id === scenario.id
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => onLoadScenario(scenario)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-gray-900">
                      {scenario.scenarioName}
                    </h5>
                    <div className="flex items-center gap-2">
                      {scenario.isConvertedToGoals && (
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full"
                          title="Converted to goals"
                        />
                      )}
                      <div className="text-xs text-gray-500">
                        {formatDate(scenario.createdAt)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getScenarioSummary(scenario)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Feature */}
      {savedScenarios.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">📊 Quick Compare</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Click any scenario to load it</p>
            <p>• Use visualization to compare outcomes</p>
            <p>• Convert promising scenarios to actual goals</p>
          </div>
        </div>
      )}
    </div>
  );
}
