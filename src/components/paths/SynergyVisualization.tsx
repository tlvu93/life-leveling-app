"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Interest, PredefinedPath } from "@/types";
import { SkillSynergy } from "@/lib/path-management";

interface SynergyVisualizationProps {
  userInterests: Interest[];
  paths: PredefinedPath[];
  synergies: SkillSynergy[];
  width?: number;
  height?: number;
  onNodeClick?: (skill: string) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  skill: string;
  level: number;
  group: number;
  radius: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
  description: string;
}

export default function SynergyVisualization({
  userInterests,
  paths,
  synergies,
  width = 600,
  height = 400,
  onNodeClick,
}: SynergyVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || synergies.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Create nodes from user interests
    const nodes: Node[] = userInterests.map((interest, index) => ({
      id: interest.category,
      skill: interest.category,
      level: interest.currentLevel,
      group: index % 5, // Color groups
      radius: 20 + interest.currentLevel * 5, // Size based on skill level
    }));

    // Create links from synergies
    const links: Link[] = synergies.map((synergy) => ({
      source: synergy.sourceSkill,
      target: synergy.targetSkill,
      value: synergy.synergyFactor,
      description: synergy.description,
    }));

    // Set up SVG
    const svg = d3.select(svgRef.current);
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.radius + 5)
      );

    // Create arrow markers for directed links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["arrow"])
      .enter()
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#666");

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#666")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value * 10))
      .attr("marker-end", "url(#arrow)");

    // Create link labels
    const linkLabels = g
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .text((d) => `+${Math.round(d.value * 100)}%`);

    // Create nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => colorScale(d.group.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onNodeClick?.(d.skill);
      });

    // Add node labels
    const nodeLabels = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text((d) => d.skill.substring(0, 8))
      .style("pointer-events", "none");

    // Add level indicators
    const levelLabels = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text((d) => `Lv.${d.level}`)
      .style("pointer-events", "none");

    // Add tooltips
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("z-index", "1000");

    // Add hover effects
    node
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .text(`${d.skill} - Level ${d.level}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    link
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").text(d.description);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      linkLabels
        .attr("x", (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr("y", (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

      nodeLabels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);

      levelLabels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    // Cleanup function
    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [userInterests, paths, synergies, width, height, onNodeClick]);

  if (synergies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Synergies Found
          </h3>
          <p className="text-gray-500">
            Add more interests to discover skill synergies and connections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Skill Synergy Network
        </h3>
        <p className="text-sm text-gray-600">
          This visualization shows how your skills connect and boost each other.
          Larger circles represent higher skill levels, and arrows show synergy
          relationships.
        </p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto"
          viewBox={`0 0 ${width} ${height}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>Circle size = Skill level</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-gray-600 mr-2"></div>
              <span>Arrow thickness = Synergy strength</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Tips</h4>
          <ul className="text-sm space-y-1">
            <li>• Click nodes to explore paths</li>
            <li>• Hover for detailed information</li>
            <li>• Zoom and pan to explore</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
