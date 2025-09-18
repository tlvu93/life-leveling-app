"use client";

import React, { useState, useEffect } from "react";
import LifeStatMatrix from "./LifeStatMatrix";
import { LifeStatMatrixData } from "@/types";

interface ResponsiveLifeStatMatrixProps {
  data: LifeStatMatrixData;
  className?: string;
  onSkillClick?: (skill: string) => void;
  showHistorical?: boolean;
}

export default function ResponsiveLifeStatMatrix({
  data,
  className = "",
  onSkillClick,
  showHistorical = false,
}: ResponsiveLifeStatMatrixProps) {
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);

      if (isMobileView) {
        // Mobile: smaller chart, more compact
        const size = Math.min(window.innerWidth - 40, 320);
        setDimensions({ width: size, height: size });
      } else if (window.innerWidth < 1024) {
        // Tablet: medium size
        setDimensions({ width: 400, height: 400 });
      } else {
        // Desktop: larger size
        setDimensions({ width: 500, height: 500 });
      }
    };

    // Initial calculation
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Chart Title */}
      <div className="mb-4 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Your LifeStat Matrix
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Track your skills across different interests.
          {showHistorical ? " Gray areas show your previous levels." : ""}
        </p>
      </div>

      {/* Main Chart Container */}
      <div className="relative bg-card rounded-xl shadow-lg p-4 md:p-6 border border-border">
        <LifeStatMatrix
          data={data}
          width={dimensions.width}
          height={dimensions.height}
          onSkillClick={onSkillClick}
          showHistorical={showHistorical}
          animationDuration={isMobile ? 500 : 750} // Faster animations on mobile
        />
      </div>

      {/* Mobile-specific controls */}
      {isMobile && (
        <div className="mt-4 w-full max-w-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              Tap on skill points for details
            </p>
          </div>
        </div>
      )}

      {/* Skills Summary for accessibility */}
      <div className="mt-4 w-full max-w-2xl">
        <details className="bg-muted/50 rounded-lg p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
            Skills Summary (Accessible View)
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {data.current.map((skill, index) => (
              <div
                key={skill.skill}
                className="flex justify-between items-center p-2 bg-card rounded border border-border"
              >
                <span className="font-medium text-foreground">
                  {skill.skill}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Level {skill.value} of {skill.maxValue}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: skill.maxValue }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < skill.value ? "bg-primary" : "bg-muted"
                        }`}
                        aria-label={`Level ${i + 1} ${
                          i < skill.value ? "achieved" : "not achieved"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
