"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { RadarChartData, LifeStatMatrixData, SkillLevel } from "@/types";

interface LifeStatMatrixProps {
  data: LifeStatMatrixData;
  width?: number;
  height?: number;
  className?: string;
  onSkillClick?: (skill: string) => void;
  showHistorical?: boolean;
  animationDuration?: number;
}

interface RadarChartConfig {
  radius: number;
  centerX: number;
  centerY: number;
  levels: number;
  maxValue: number;
  angleSlice: number;
}

export default function LifeStatMatrix({
  data,
  width = 400,
  height = 400,
  className = "",
  onSkillClick,
  showHistorical = false,
  animationDuration = 750,
}: LifeStatMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

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

  // Color scheme for skills
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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
    drawRadarArea(g, config, data.current, colorScale, false);

    // Draw historical data if available and requested
    if (showHistorical && data.historical && data.historical.length > 0) {
      const latestHistorical = data.historical[data.historical.length - 1];
      drawRadarArea(g, config, latestHistorical.data, colorScale, true);
    }

    // Draw data points
    drawDataPoints(g, config, data.current, colorScale);

    // Add interactivity
    addInteractivity(g, config, data.current, onSkillClick, setHoveredSkill);
  }, [isClient, data, width, height, showHistorical, animationDuration]);

  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse text-muted-foreground">
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
        role="img"
        aria-label="Life Stat Matrix - Radar chart showing skill levels"
      >
        <title>Life Stat Matrix</title>
        <desc>
          Interactive radar chart displaying current skill levels across
          different interests.
          {hoveredSkill && ` Currently highlighting: ${hoveredSkill}`}
        </desc>
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-sm border border-border">
        <div className="text-xs font-medium text-foreground mb-1">
          Skill Levels
        </div>
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <div
              className="w-2 h-2 rounded-full border"
              style={{
                backgroundColor:
                  level <= 2 ? "#fef3c7" : level === 3 ? "#ddd6fe" : "#dcfce7",
                borderColor:
                  level <= 2 ? "#f59e0b" : level === 3 ? "#8b5cf6" : "#10b981",
              }}
            />
            <span>{getSkillLevelName(level as SkillLevel)}</span>
          </div>
        ))}
      </div>

      {/* Tooltip for hovered skill */}
      {hoveredSkill && (
        <div className="absolute bottom-2 left-2 bg-foreground text-background px-2 py-1 rounded text-sm">
          {hoveredSkill}
        </div>
      )}
    </div>
  );
}

// Helper function to draw background rings
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

  // Add level labels
  g.selectAll(".level-label")
    .data(ringData)
    .enter()
    .append("text")
    .attr("class", "level-label")
    .attr("x", 4)
    .attr("y", (d) => -d * config.radius + 4)
    .attr("font-size", "10px")
    .attr("fill", "#9ca3af")
    .text((d, i) => getSkillLevelName((i + 1) as SkillLevel));
}

// Helper function to draw axis lines and labels
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

  // Draw axis lines
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
    .attr("stroke", "#d1d5db")
    .attr("stroke-width", 1);

  // Add skill labels
  axis
    .append("text")
    .attr("class", "skill-label")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr(
      "x",
      (_, i) =>
        (config.radius + 20) * Math.cos(config.angleSlice * i - Math.PI / 2)
    )
    .attr(
      "y",
      (_, i) =>
        (config.radius + 20) * Math.sin(config.angleSlice * i - Math.PI / 2)
    )
    .attr("font-size", "12px")
    .attr("font-weight", "500")
    .attr("fill", "#374151")
    .text((d) => d.skill);
}

// Helper function to draw radar area
function drawRadarArea(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  colorScale: d3.ScaleOrdinal<string, string, never>,
  isHistorical: boolean
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
    .attr("fill", isHistorical ? "#e5e7eb" : "#3b82f6")
    .attr("fill-opacity", isHistorical ? 0.2 : 0.3)
    .attr("stroke", isHistorical ? "#9ca3af" : "#2563eb")
    .attr("stroke-width", isHistorical ? 1 : 2)
    .attr("stroke-dasharray", isHistorical ? "5,5" : "none");

  // Animate the area
  const totalLength = area.node()?.getTotalLength() || 0;
  area
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(750)
    .attr("stroke-dashoffset", 0)
    .attr("stroke-dasharray", isHistorical ? "5,5" : "none");
}

// Helper function to draw data points
function drawDataPoints(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  colorScale: d3.ScaleOrdinal<string, string, never>
) {
  const points = g
    .selectAll(".data-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "data-point")
    .attr("cx", (_, i) => {
      const angle = config.angleSlice * i - Math.PI / 2;
      return 0; // Start from center for animation
    })
    .attr("cy", 0)
    .attr("r", 0)
    .attr("fill", (d) => d.color || colorScale(d.skill))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  // Animate points to their final positions
  points
    .transition()
    .duration(750)
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
    .attr("r", 4);
}

// Helper function to add interactivity
function addInteractivity(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: RadarChartConfig,
  data: RadarChartData[],
  onSkillClick?: (skill: string) => void,
  setHoveredSkill?: (skill: string | null) => void
) {
  // Create invisible larger circles for better hover/click targets
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
    .attr("r", 12)
    .attr("fill", "transparent")
    .attr("cursor", onSkillClick ? "pointer" : "default")
    .on("mouseenter", (event, d) => {
      setHoveredSkill?.(d.skill);
      // Highlight the corresponding data point
      g.selectAll(".data-point")
        .filter((pointData: any) => pointData.skill === d.skill)
        .transition()
        .duration(200)
        .attr("r", 6);
    })
    .on("mouseleave", () => {
      setHoveredSkill?.(null);
      // Reset all data points
      g.selectAll(".data-point").transition().duration(200).attr("r", 4);
    })
    .on("click", (event, d) => {
      if (onSkillClick) {
        onSkillClick(d.skill);
      }
    });
}

// Helper function to get skill level name
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
