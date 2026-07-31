"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserProfile,
  SimulationScenario,
  type ForecastedResults,
} from "@/types";
import { parseForecastedResults } from "@/lib/simulation";
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
  const [timeframeWeeks, setTimeframeWeeks] = useState<number>(8);
  const [forecastedResults, setForecastedResults] = useState<ForecastedResults>(
    {}
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>(
    []
  );
  const [showComparison, setShowComparison] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const interests = useMemo(
    () => userProfile.interests ?? [],
    [userProfile.interests]
  );

  // Spread effort evenly across the tracked interests, giving the remainder to
  // the last one so the allocation always sums to exactly 100%.
  const initialAllocation = useMemo(() => {
    const allocation: Record<string, number> = {};
    if (interests.length === 0) return allocation;

    const equalEffort = Math.floor(100 / interests.length);
    let remainingEffort = 100;

    interests.forEach((interest, index) => {
      if (index === interests.length - 1) {
        allocation[interest.category] = remainingEffort;
      } else {
        allocation[interest.category] = equalEffort;
        remainingEffort -= equalEffort;
      }
    });

    return allocation;
  }, [interests]);

  // Track the allocation the user is actively editing. It starts out equal
  // to `initialAllocation` and is re-synced whenever the computed default
  // changes (e.g. the tracked interests change) — but user edits in between
  // are preserved, since this only runs when `initialAllocation` itself
  // changes identity, not on every render.
  const [effortAllocation, setEffortAllocation] =
    useState<Record<string, number>>(initialAllocation);
  const [syncedAllocation, setSyncedAllocation] = useState(initialAllocation);
  if (initialAllocation !== syncedAllocation) {
    setSyncedAllocation(initialAllocation);
    setEffortAllocation(initialAllocation);
  }

  const loadSavedScenarios = useCallback(async () => {
    try {
      const response = await fetch("/api/architect/scenarios");
      if (response.ok) {
        const data = await response.json();
        setSavedScenarios(data.scenarios ?? []);
      }
    } catch (error) {
      console.error("Failed to load saved scenarios:", error);
    }
  }, []);

  useEffect(() => {
    void loadSavedScenarios();
  }, [loadSavedScenarios]);

  const handleEffortChange = (category: string, effort: number) => {
    setEffortAllocation((prev) => ({
      ...prev,
      [category]: effort,
    }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);

    try {
      const response = await fetch("/api/architect/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effortAllocation,
          timeframeWeeks,
          currentInterests: interests,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForecastedResults(parseForecastedResults(data.forecastedResults));
      } else {
        setSimulationError(
          "We could not run that simulation. Please try again."
        );
      }
    } catch (error) {
      console.error("Simulation error:", error);
      setSimulationError("Something went wrong while running the simulation.");
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
    // Persisted scenarios are JSON blobs that predate `SimulationResult`.
    setForecastedResults(parseForecastedResults(scenario.forecastedResults));
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
              type="button"
              onClick={runSimulation}
              disabled={isSimulating || interests.length === 0}
              aria-busy={isSimulating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {isSimulating ? "Running simulation" : ""}
        </p>

        {simulationError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-300"
          >
            {simulationError}
          </p>
        )}

        {interests.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Add at least one interest during onboarding to run simulations.
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Effort Allocation */}
        <div className="xl:col-span-1">
          <EffortAllocationPanel
            interests={interests}
            effortAllocation={effortAllocation}
            onEffortChange={handleEffortChange}
          />
        </div>

        {/* Middle Column - Visualization */}
        <div className="xl:col-span-1">
          <SimulationVisualization
            currentInterests={interests}
            effortAllocation={effortAllocation}
            forecastedResults={forecastedResults}
            timeframeWeeks={timeframeWeeks}
          />
        </div>

        {/* Right Column - Analysis & Management */}
        <div className="xl:col-span-1 space-y-6">
          <TradeOffAnalysis
            effortAllocation={effortAllocation}
            interests={interests}
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
          userInterests={interests}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
