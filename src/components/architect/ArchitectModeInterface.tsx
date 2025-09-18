"use client";

import { useState, useEffect } from "react";
import { UserProfile, Interest, SimulationScenario } from "@/types";
import EffortAllocationPanel from "./EffortAllocationPanel";
import SimulationVisualization from "./SimulationVisualization";
import ScenarioManager from "./ScenarioManager";
import TradeOffAnalysis from "./TradeOffAnalysis";
import ScenarioComparison from "./ScenarioComparison";

interface ArchitectModeInterfaceProps {
  userProfile: UserProfile;
}

export default function ArchitectModeInterface({
  userProfile,
}: ArchitectModeInterfaceProps) {
  const [currentScenario, setCurrentScenario] =
    useState<SimulationScenario | null>(null);
  const [effortAllocation, setEffortAllocation] = useState<
    Record<string, number>
  >({});
  const [timeframeWeeks, setTimeframeWeeks] = useState<number>(8);
  const [forecastedResults, setForecastedResults] = useState<
    Record<string, unknown>
  >({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>(
    []
  );
  const [showComparison, setShowComparison] = useState(false);

  // Initialize effort allocation with user's current interests
  useEffect(() => {
    const initialAllocation: Record<string, number> = {};
    const equalEffort = Math.floor(100 / userProfile.interests.length);
    let remainingEffort = 100;

    userProfile.interests.forEach((interest, index) => {
      if (index === userProfile.interests.length - 1) {
        // Give remaining effort to last interest to ensure total is 100%
        initialAllocation[interest.category] = remainingEffort;
      } else {
        initialAllocation[interest.category] = equalEffort;
        remainingEffort -= equalEffort;
      }
    });

    setEffortAllocation(initialAllocation);
  }, [userProfile.interests]);

  // Load saved scenarios on component mount
  useEffect(() => {
    loadSavedScenarios();
  }, []);

  const loadSavedScenarios = async () => {
    try {
      const response = await fetch("/api/architect/scenarios");
      if (response.ok) {
        const data = await response.json();
        setSavedScenarios(data.scenarios || []);
      }
    } catch (error) {
      console.error("Failed to load saved scenarios:", error);
    }
  };

  const handleEffortChange = (category: string, effort: number) => {
    setEffortAllocation((prev) => ({
      ...prev,
      [category]: effort,
    }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);

    try {
      const response = await fetch("/api/architect/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effortAllocation,
          timeframeWeeks,
          currentInterests: userProfile.interests,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForecastedResults(data.forecastedResults);
      } else {
        console.error("Simulation failed");
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const saveScenario = async (scenarioName: string) => {
    try {
      const response = await fetch("/api/architect/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioName,
          effortAllocation,
          forecastedResults,
          timeframeWeeks,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedScenarios((prev) => [...prev, data.scenario]);
        setCurrentScenario(data.scenario);
      }
    } catch (error) {
      console.error("Failed to save scenario:", error);
    }
  };

  const loadScenario = (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    setEffortAllocation(scenario.effortAllocation);
    setTimeframeWeeks(scenario.timeframeWeeks);
    setForecastedResults(scenario.forecastedResults);
  };

  const convertToGoals = async () => {
    if (!currentScenario) return;

    try {
      const response = await fetch("/api/architect/convert-to-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId: currentScenario.id,
          effortAllocation,
          forecastedResults,
          timeframeWeeks,
        }),
      });

      if (response.ok) {
        // Update scenario as converted
        setSavedScenarios((prev) =>
          prev.map((s) =>
            s.id === currentScenario.id ? { ...s, isConvertedToGoals: true } : s
          )
        );
        setCurrentScenario((prev) =>
          prev ? { ...prev, isConvertedToGoals: true } : null
        );
      }
    } catch (error) {
      console.error("Failed to convert to goals:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Simulation Sandbox
            </h2>
            <p className="text-muted-foreground">
              Experiment with different effort allocations and see projected
              outcomes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="timeframe"
                className="text-sm font-medium text-foreground"
              >
                Timeframe:
              </label>
              <select
                id="timeframe"
                value={timeframeWeeks}
                onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
              >
                <option value={4}>4 weeks</option>
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
              </select>
            </div>

            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Effort Allocation */}
        <div className="xl:col-span-1">
          <EffortAllocationPanel
            interests={userProfile.interests}
            effortAllocation={effortAllocation}
            onEffortChange={handleEffortChange}
          />
        </div>

        {/* Middle Column - Visualization */}
        <div className="xl:col-span-1">
          <SimulationVisualization
            currentInterests={userProfile.interests}
            effortAllocation={effortAllocation}
            forecastedResults={forecastedResults}
            timeframeWeeks={timeframeWeeks}
          />
        </div>

        {/* Right Column - Analysis & Management */}
        <div className="xl:col-span-1 space-y-6">
          <TradeOffAnalysis
            effortAllocation={effortAllocation}
            forecastedResults={forecastedResults}
            interests={userProfile.interests}
          />

          <ScenarioManager
            currentScenario={currentScenario}
            savedScenarios={savedScenarios}
            onSaveScenario={saveScenario}
            onLoadScenario={loadScenario}
            onConvertToGoals={convertToGoals}
            onCompareScenarios={() => setShowComparison(true)}
          />
        </div>
      </div>

      {/* Scenario Comparison Modal */}
      {showComparison && (
        <ScenarioComparison
          scenarios={savedScenarios}
          userInterests={userProfile.interests}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
