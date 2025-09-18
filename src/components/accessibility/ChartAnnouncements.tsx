"use client";

import React, { useEffect, useRef } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface ChartAnnouncementsProps {
  announcements: string[];
  priority?: "polite" | "assertive";
  clearAfter?: number;
}

export const ChartAnnouncements: React.FC<ChartAnnouncementsProps> = ({
  announcements,
  priority = "polite",
  clearAfter = 3000,
}) => {
  const { announceToScreenReader } = useAccessibility();
  const previousAnnouncementsRef = useRef<string[]>([]);

  useEffect(() => {
    const newAnnouncements = announcements.filter(
      (announcement) => !previousAnnouncementsRef.current.includes(announcement)
    );

    newAnnouncements.forEach((announcement) => {
      announceToScreenReader(announcement, priority);
    });

    previousAnnouncementsRef.current = announcements;

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        previousAnnouncementsRef.current = [];
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [announcements, priority, clearAfter, announceToScreenReader]);

  return (
    <div className="sr-only" aria-live={priority} aria-atomic="true">
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  );
};

// Hook for managing chart announcements
export const useChartAnnouncements = () => {
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  const addAnnouncement = (message: string) => {
    setAnnouncements((prev) => [...prev, message]);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  const announceDataUpdate = (
    skillName: string,
    oldValue: number,
    newValue: number
  ) => {
    const message = `${skillName} updated from ${oldValue} to ${newValue}`;
    addAnnouncement(message);
  };

  const announceChartInteraction = (action: string, skillName?: string) => {
    let message = "";
    switch (action) {
      case "focus":
        message = skillName ? `Focused on ${skillName}` : "Chart focused";
        break;
      case "select":
        message = skillName ? `Selected ${skillName}` : "Item selected";
        break;
      case "hover":
        message = skillName ? `Hovering over ${skillName}` : "Item hovered";
        break;
      default:
        message = action;
    }
    addAnnouncement(message);
  };

  const announceChartNavigation = (direction: string, currentItem?: string) => {
    const message = `Navigated ${direction}${
      currentItem ? ` to ${currentItem}` : ""
    }`;
    addAnnouncement(message);
  };

  return {
    announcements,
    addAnnouncement,
    clearAnnouncements,
    announceDataUpdate,
    announceChartInteraction,
    announceChartNavigation,
    ChartAnnouncements: (
      props: Omit<ChartAnnouncementsProps, "announcements">
    ) => <ChartAnnouncements announcements={announcements} {...props} />,
  };
};

// Sonification utilities for data exploration
export const useSonification = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (
    frequency: number,
    duration: number = 200,
    volume: number = 0.1
  ) => {
    const audioContext = initializeAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration / 1000
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  };

  const sonifyDataPoint = (value: number, maxValue: number = 4) => {
    // Map value to frequency range (200Hz to 800Hz)
    const minFreq = 200;
    const maxFreq = 800;
    const frequency = minFreq + (value / maxValue) * (maxFreq - minFreq);
    playTone(frequency);
  };

  const sonifyDataSeries = (
    values: number[],
    maxValue: number = 4,
    interval: number = 300
  ) => {
    values.forEach((value, index) => {
      setTimeout(() => {
        sonifyDataPoint(value, maxValue);
      }, index * interval);
    });
  };

  return {
    playTone,
    sonifyDataPoint,
    sonifyDataSeries,
  };
};

// Data table generator for charts
export const generateChartDataTable = (
  data: Array<{ label: string; value: number; [key: string]: any }>,
  title: string = "Chart Data",
  additionalColumns?: Array<{
    key: string;
    label: string;
    formatter?: (value: any) => string;
  }>
) => {
  return {
    title,
    headers: [
      "Item",
      "Value",
      ...(additionalColumns?.map((col) => col.label) || []),
    ],
    rows: data.map((item) => [
      item.label,
      item.value.toString(),
      ...(additionalColumns?.map((col) =>
        col.formatter
          ? col.formatter(item[col.key])
          : item[col.key]?.toString() || ""
      ) || []),
    ]),
  };
};

// Chart description generator
export const generateChartDescription = (
  data: Array<{ label: string; value: number }>,
  chartType: string = "chart",
  maxValue?: number
) => {
  if (data.length === 0) {
    return `Empty ${chartType} with no data points.`;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;

  const minItems = data.filter((d) => d.value === min).map((d) => d.label);
  const maxItems = data.filter((d) => d.value === max).map((d) => d.label);

  let description = `${chartType} showing ${data.length} data points. `;

  if (maxValue) {
    description += `Values range from ${min} to ${max} out of ${maxValue}. `;
  } else {
    description += `Values range from ${min} to ${max}. `;
  }

  description += `Average value is ${average.toFixed(1)}. `;

  if (minItems.length === 1) {
    description += `Lowest value is ${minItems[0]} at ${min}. `;
  } else {
    description += `Lowest values are ${minItems.join(", ")} at ${min}. `;
  }

  if (maxItems.length === 1) {
    description += `Highest value is ${maxItems[0]} at ${max}.`;
  } else {
    description += `Highest values are ${maxItems.join(", ")} at ${max}.`;
  }

  return description;
};

export default ChartAnnouncements;
