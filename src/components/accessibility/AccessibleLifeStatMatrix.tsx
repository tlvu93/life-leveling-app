"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { RadarChartData, LifeStatMatrixData, SkillLevel } from "@/types";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { KEYBOARD_KEYS, announceToScreenReader } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";

interface AccessibleLifeStatMatrixProps {
  data: LifeStatMatrixData;
  width?: number;
  height?: number;
  className?: string;
  onSkillClick?: (skill: string) => void;
  showHistorical?: boolean;
  animationDuration?: number;
  title?: string;
  description?: string;
}

interface RadarChartConfig {
  radius: number;
  centerX: number;
  centerY: number;
  levels: number;
  maxValue: number;
  angleSlice: number;
}

export default function AccessibleLifeStatMatrix({
  data,
  width = 400,
  height = 400,
  className = "",
  onSkillClick,
  showHistorical = false,
  animationDuration = 750,
  title = "Life Stat Matrix",
  description = "Interactive radar chart displaying current skill levels across different interests",
}: AccessibleLifeStatMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [focusedSkillIndex, setFocusedSkillIndex] = useState<number>(-1);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showTextDescription, setShowTextDescription] = useState(false);

  const { isReducedMotion, announceToScreenReader: announce } =
    useAccessibility();

  // Ensure we're on the client side for D3 rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Configuration for the radar chart
  const config: RadarChartConfig = {
    radius: Math.min(width, height) / 2 - 60,
    centerX: width / 2,
    centerY: height / 2,
    levels: 4, // Novice, Intermediate, Advanced, Expert
    maxValue: 4, // Maximum skill level
    angleSlice: (Math.PI * 2) / data.current.length,
  };

  // Color scheme for skills with high contrast support
  const colorScale = d3.scaleOrdinal([
    "#1e40af",
    "#dc2626",
    "#059669",
    "#7c2d12",
    "#6b21a8",
    "#be185d",
    "#0369a1",
    "#ea580c",
  ]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const skillCount = data.current.length;

      switch (event.key) {
        case KEYBOARD_KEYS.ARROW_RIGHT:
        case KEYBOARD_KEYS.ARROW_DOWN:
          event.preventDefault();
          setFocusedSkillIndex((prev) => {
            const newIndex = prev < skillCount - 1 ? prev + 1 : 0;
            const skill = data.current[newIndex];
            announce(
              `${skill.skill}: ${getSkillLevelName(skill.value as SkillLevel)}`,
              "polite"
            );
            return newIndex;
          });
          break;

        case KEYBOARD_KEYS.ARROW_LEFT:
        case KEYBOARD_KEYS.ARROW_UP:
          event.preventDefault();
          setFocusedSkillIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : skillCount - 1;
            const skill = data.current[newIndex];
            announce(
              `${skill.skill}: ${getSkillLevelName(skill.value as SkillLevel)}`,
              "polite"
            );
            return newIndex;
          });
          break;

        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          event.preventDefault();
          if (focusedSkillIndex >= 0 && onSkillClick) {
            const skill = data.current[focusedSkillIndex];
            onSkillClick(skill.skill);
            announce(`Selected ${skill.skill}`, "assertive");
          }
          break;

        case KEYBOARD_KEYS.HOME:
          event.preventDefault();
          setFocusedSkillIndex(0);
          if (data.current.length > 0) {
            const skill = data.current[0];
            announce(
              `${skill.skill}: ${getSkillLevelName(skill.value as SkillLevel)}`,
              "polite"
            );
          }
          break;

        case KEYBOARD_KEYS.END:
          event.preventDefault();
          setFocusedSkillIndex(skillCount - 1);
          if (skillCount > 0) {
            const skill = data.current[skillCount - 1];
            announce(
              `${skill.skill}: ${getSkillLevelName(skill.value as SkillLevel)}`,
              "polite"
            );
          }
          break;
      }
    },
    [data.current, focusedSkillIndex, onSkillClick, announce]
  );

  // Generate text description of the chart
  const generateTextDescription = () => {
    const descriptions = data.current.map(
      (item) =>
        `${item.skill}: ${getSkillLevelName(item.value as SkillLevel)} (${
          item.value
        } out of 4)`
    );

    const averageLevel =
      data.current.reduce((sum, item) => sum + item.value, 0) /
      data.current.length;
    const roundedAverage = Math.round(averageLevel * 10) / 10;

    return `Your skill levels are: ${descriptions.join(
      ", "
    )}. Your average skill level is ${roundedAverage} out of 4.`;
  };

  // Chart rendering effect
  useEffect(() => {
    if (!isClient || !svgRef.current || !data.current.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${config.centerX}, ${config.centerY})`);

    // Draw background circles (skill level rings)
    drawBackgroundRings(g, config);

    // Draw axis lines and labels
    drawAxisLines(g, config, data.current);

    // Draw the radar area for current data
    drawRadarArea(
      g,
      config,
      data.current,
      colorScale,
      false,
      isReducedMotion ? 0 : animationDuration
    );

    // Draw historical data if available and requested
    if (showHistorical && data.historical && data.historical.length > 0) {
      const latestHistorical = data.historical[data.historical.length - 1];
      drawRadarArea(
        g,
        config,
        latestHistorical.data,
        colorScale,
        true,
        isReducedMotion ? 0 : animationDuration
      );
    }

    // Draw data points
    drawDataPoints(
      g,
      config,
      data.current,
      colorScale,
      focusedSkillIndex,
      isReducedMotion ? 0 : animationDuration
    );

    // Add interactivity
    addInteractivity(
      g,
      config,
      data.current,
      onSkillClick,
      setHoveredSkill,
      focusedSkillIndex
    );
  }, [
    isClient,
    data,
    width,
    height,
    showHistorical,
    animationDuration,
    focusedSkillIndex,
    isReducedMotion,
    colorScale,
    config,
    onSkillClick,
  ]);

  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse text-neutral-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Accessibility controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => setShowDataTable(!showDataTable)}
          variant="outline"
          size="sm"
          ariaLabel={showDataTable ? "Hide data table" : "Show data table"}
          ariaExpanded={showDataTable}
          ariaControls="chart-data-table"
        >
          {showDataTable ? "Hide" : "Show"} Data Table
        </Button>

        <Button
          onClick={() => setShowTextDescription(!showTextDescription)}
          variant="outline"
          size="sm"
          ariaLabel={
            showTextDescription
              ? "Hide text description"
              : "Show text description"
          }
          ariaExpanded={showTextDescription}
          ariaControls="chart-text-description"
        >
          {showTextDescription ? "Hide" : "Show"} Text Description
        </Button>
      </div>

      {/* Text description */}
      {showTextDescription && (
        <div
          id="chart-text-description"
          className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
          role="region"
          aria-labelledby="text-description-title"
        >
          <h3 id="text-description-title" className="font-semibold mb-2">
            Chart Description
          </h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {generateTextDescription()}
          </p>
        </div>
      )}

      {/* Data table alternative */}
      {showDataTable && (
        <div
          id="chart-data-table"
          className="mb-4 overflow-x-auto"
          role="region"
          aria-labelledby="data-table-title"
        >
          <h3 id="data-table-title" className="font-semibold mb-2">
            Skill Level Data
          </h3>
          <table className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800">
                <th className="px-4 py-2 text-left border-b border-neutral-200 dark:border-neutral-700">
                  Skill
                </th>
                <th className="px-4 py-2 text-left border-b border-neutral-200 dark:border-neutral-700">
                  Current Level
                </th>
                <th className="px-4 py-2 text-left border-b border-neutral-200 dark:border-neutral-700">
                  Numeric Value
                </th>
                {showHistorical &&
                  data.historical &&
                  data.historical.length > 0 && (
                    <th className="px-4 py-2 text-left border-b border-neutral-200 dark:border-neutral-700">
                      Previous Level
                    </th>
                  )}
              </tr>
            </thead>
            <tbody>
              {data.current.map((item, index) => {
                const historicalItem =
                  showHistorical &&
                  data.historical &&
                  data.historical.length > 0
                    ? data.historical[data.historical.length - 1].data.find(
                        (h) => h.skill === item.skill
                      )
                    : null;

                return (
                  <tr
                    key={item.skill}
                    className={`${
                      index % 2 === 0
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-50 dark:bg-neutral-800"
                    } hover:bg-neutral-100 dark:hover:bg-neutral-700`}
                  >
                    <td className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 font-medium">
                      {item.skill}
                    </td>
                    <td className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      {getSkillLevelName(item.value as SkillLevel)}
                    </td>
                    <td className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      {item.value} / 4
                    </td>
                    {showHistorical &&
                      data.historical &&
                      data.historical.length > 0 && (
                        <td className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                          {historicalItem
                            ? getSkillLevelName(
                                historicalItem.value as SkillLevel
                              )
                            : "N/A"}
                        </td>
                      )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SVG Chart */}
      <div
        role="img"
        aria-labelledby="chart-title"
        aria-describedby="chart-description"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
      >
        <h2 id="chart-title" className="sr-only">
          {title}
        </h2>
        <p id="chart-description" className="sr-only">
          {description}. Use arrow keys to navigate between skills, Enter or
          Space to select.
          {focusedSkillIndex >= 0 &&
            ` Currently focused on ${data.current[focusedSkillIndex]?.skill}.`}
        </p>

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
          aria-hidden="true"
        >
          <title>{title}</title>
          <desc>{description}</desc>
        </svg>
      </div>

      {/* Legend */}
      <div
        className="mt-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg p-4 shadow-sm"
        role="region"
        aria-labelledby="legend-title"
      >
        <h3
          id="legend-title"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
        >
          Skill Levels
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
            >
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: getSkillLevelColor(level as SkillLevel).bg,
                  borderColor: getSkillLevelColor(level as SkillLevel).border,
                }}
                aria-hidden="true"
              />
              <span>{getSkillLevelName(level as SkillLevel)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current focus announcement */}
      {focusedSkillIndex >= 0 && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Currently focused on {data.current[focusedSkillIndex]?.skill}:{" "}
          {getSkillLevelName(
            data.current[focusedSkillIndex]?.value as SkillLevel
          )}
        </div>
      )}

      {/* Hover announcement */}
      {hoveredSkill && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Hovering over {hoveredSkill}
        </div>
      )}
    </div>
  );
}

// Helper functions (same as original but with accessibility enhancements)
function drawBackgroundRings(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig
) {
  const ringData = Array.from(
    { length: config.levels },
    (_, i) => (i + 1) / config.levels
  );

  g.selectAll(".level-ring")
    .data(ringData)
    .enter()
    .append("circle")
    .attr("class", "level-ring")
    .attr("r", (d) => d * config.radius)
    .attr("fill", "none")
    .attr("stroke", "#e5e7eb")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,2");

  // Add level labels with better contrast
  g.selectAll(".level-label")
    .data(ringData)
    .enter()
    .append("text")
    .attr("class", "level-label")
    .attr("x", 4)
    .attr("y", (d) => -d * config.radius + 4)
    .attr("font-size", "12px")
    .attr("font-weight", "500")
    .attr("fill", "#374151")
    .text((d, i) => getSkillLevelName((i + 1) as SkillLevel));
}

function drawAxisLines(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[]
) {
  const axis = g
    .selectAll(".axis")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "axis");

  // Draw axis lines with better contrast
  axis
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr(
      "x2",
      (_, i) => config.radius * Math.cos(config.angleSlice * i - Math.PI / 2)
    )
    .attr(
      "y2",
      (_, i) => config.radius * Math.sin(config.angleSlice * i - Math.PI / 2)
    )
    .attr("stroke", "#9ca3af")
    .attr("stroke-width", 1);

  // Add skill labels with better accessibility
  axis
    .append("text")
    .attr("class", "skill-label")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr(
      "x",
      (_, i) =>
        (config.radius + 25) * Math.cos(config.angleSlice * i - Math.PI / 2)
    )
    .attr(
      "y",
      (_, i) =>
        (config.radius + 25) * Math.sin(config.angleSlice * i - Math.PI / 2)
    )
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .attr("fill", "#1f2937")
    .text((d) => d.skill);
}

function drawRadarArea(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  colorScale: d3.ScaleOrdinal<string, string, never>,
  isHistorical: boolean,
  animationDuration: number
) {
  const lineGenerator = d3
    .lineRadial<RadarChartData>()
    .angle((_, i) => config.angleSlice * i)
    .radius((d) => (d.value / config.maxValue) * config.radius)
    .curve(d3.curveLinearClosed);

  const area = g
    .append("path")
    .datum(data)
    .attr(
      "class",
      isHistorical ? "radar-area-historical" : "radar-area-current"
    )
    .attr("d", lineGenerator)
    .attr("fill", isHistorical ? "#9ca3af" : "#3b82f6")
    .attr("fill-opacity", isHistorical ? 0.15 : 0.25)
    .attr("stroke", isHistorical ? "#6b7280" : "#1d4ed8")
    .attr("stroke-width", isHistorical ? 2 : 3)
    .attr("stroke-dasharray", isHistorical ? "8,4" : "none");

  // Animate the area if motion is not reduced
  if (animationDuration > 0) {
    const totalLength = area.node()?.getTotalLength() || 0;
    area
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(animationDuration)
      .attr("stroke-dashoffset", 0)
      .attr("stroke-dasharray", isHistorical ? "8,4" : "none");
  }
}

function drawDataPoints(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  colorScale: d3.ScaleOrdinal<string, string, never>,
  focusedIndex: number,
  animationDuration: number
) {
  const points = g
    .selectAll(".data-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "data-point")
    .attr("cx", (_, i) => {
      const angle = config.angleSlice * i - Math.PI / 2;
      const radius = (data[i].value / config.maxValue) * config.radius;
      return animationDuration > 0 ? 0 : radius * Math.cos(angle);
    })
    .attr("cy", (_, i) => {
      const angle = config.angleSlice * i - Math.PI / 2;
      const radius = (data[i].value / config.maxValue) * config.radius;
      return animationDuration > 0 ? 0 : radius * Math.sin(angle);
    })
    .attr("r", animationDuration > 0 ? 0 : 5)
    .attr("fill", (d) => d.color || colorScale(d.skill))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("class", (_, i) =>
      i === focusedIndex ? "data-point focused" : "data-point"
    );

  // Animate points to their final positions if motion is not reduced
  if (animationDuration > 0) {
    points
      .transition()
      .duration(animationDuration)
      .delay((_, i) => i * 100)
      .attr("cx", (d, i) => {
        const angle = config.angleSlice * i - Math.PI / 2;
        const radius = (d.value / config.maxValue) * config.radius;
        return radius * Math.cos(angle);
      })
      .attr("cy", (d, i) => {
        const angle = config.angleSlice * i - Math.PI / 2;
        const radius = (d.value / config.maxValue) * config.radius;
        return radius * Math.sin(angle);
      })
      .attr("r", 5);
  }

  // Highlight focused point
  points
    .attr("r", (_, i) => (i === focusedIndex ? 7 : 5))
    .attr("stroke-width", (_, i) => (i === focusedIndex ? 3 : 2));
}

function addInteractivity(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  onSkillClick?: (skill: string) => void,
  setHoveredSkill?: (skill: string | null) => void,
  focusedIndex?: number
) {
  // Create larger invisible circles for better touch/click targets (48x48px minimum)
  g.selectAll(".interaction-area")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "interaction-area")
    .attr("cx", (d, i) => {
      const angle = config.angleSlice * i - Math.PI / 2;
      const radius = (d.value / config.maxValue) * config.radius;
      return radius * Math.cos(angle);
    })
    .attr("cy", (d, i) => {
      const angle = config.angleSlice * i - Math.PI / 2;
      const radius = (d.value / config.maxValue) * config.radius;
      return radius * Math.sin(angle);
    })
    .attr("r", 24) // 48px diameter for accessibility
    .attr("fill", "transparent")
    .attr("cursor", onSkillClick ? "pointer" : "default")
    .on("mouseenter", (event, d) => {
      setHoveredSkill?.(d.skill);
      // Highlight the corresponding data point
      g.selectAll(".data-point")
        .filter((pointData: RadarChartData) => pointData.skill === d.skill)
        .transition()
        .duration(200)
        .attr("r", 7)
        .attr("stroke-width", 3);
    })
    .on("mouseleave", () => {
      setHoveredSkill?.(null);
      // Reset all data points except focused one
      g.selectAll(".data-point")
        .transition()
        .duration(200)
        .attr("r", (_, i) => (i === focusedIndex ? 7 : 5))
        .attr("stroke-width", (_, i) => (i === focusedIndex ? 3 : 2));
    })
    .on("click", (event, d) => {
      if (onSkillClick) {
        onSkillClick(d.skill);
      }
    });
}

function getSkillLevelName(level: SkillLevel): string {
  switch (level) {
    case SkillLevel.NOVICE:
      return "Novice";
    case SkillLevel.INTERMEDIATE:
      return "Intermediate";
    case SkillLevel.ADVANCED:
      return "Advanced";
    case SkillLevel.EXPERT:
      return "Expert";
    default:
      return "Unknown";
  }
}

function getSkillLevelColor(level: SkillLevel): { bg: string; border: string } {
  switch (level) {
    case SkillLevel.NOVICE:
      return { bg: "#fef3c7", border: "#d97706" };
    case SkillLevel.INTERMEDIATE:
      return { bg: "#e0e7ff", border: "#6366f1" };
    case SkillLevel.ADVANCED:
      return { bg: "#dcfce7", border: "#16a34a" };
    case SkillLevel.EXPERT:
      return { bg: "#fce7f3", border: "#be185d" };
    default:
      return { bg: "#f3f4f6", border: "#9ca3af" };
  }
}
