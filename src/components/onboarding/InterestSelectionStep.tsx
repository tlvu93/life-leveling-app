"use client";

import { useState } from "react";
import { INTEREST_CATEGORIES } from "@/types";

interface InterestSelectionStepProps {
  onNext: (interests: string[], subcategories: Record<string, string>) => void;
  initialSelected?: string[];
  initialSubcategories?: Record<string, string>;
}

// Subcategory options for each main category
const SUBCATEGORIES: Record<string, string[]> = {
  Music: [
    "Piano",
    "Guitar",
    "Violin",
    "Drums",
    "Singing",
    "Composition",
    "Production",
  ],
  Sports: [
    "Soccer",
    "Basketball",
    "Tennis",
    "Swimming",
    "Running",
    "Cycling",
    "Martial Arts",
  ],
  Math: [
    "Algebra",
    "Geometry",
    "Calculus",
    "Statistics",
    "Logic",
    "Problem Solving",
  ],
  Communication: [
    "Public Speaking",
    "Writing",
    "Debate",
    "Languages",
    "Presentation",
  ],
  Creativity: [
    "Drawing",
    "Painting",
    "Photography",
    "Design",
    "Crafts",
    "Animation",
  ],
  Technical: [
    "Programming",
    "Web Development",
    "Robotics",
    "Electronics",
    "3D Modeling",
  ],
  Health: [
    "Nutrition",
    "Fitness",
    "Mental Health",
    "Yoga",
    "Meditation",
    "Sleep",
  ],
  Science: [
    "Biology",
    "Chemistry",
    "Physics",
    "Astronomy",
    "Environmental",
    "Research",
  ],
  Languages: [
    "Spanish",
    "French",
    "German",
    "Japanese",
    "Chinese",
    "Sign Language",
  ],
  Arts: ["Theater", "Dance", "Film", "Literature", "Poetry", "Storytelling"],
  Reading: [
    "Fiction",
    "Non-fiction",
    "Biography",
    "History",
    "Science",
    "Philosophy",
  ],
  Writing: [
    "Creative Writing",
    "Journalism",
    "Blogging",
    "Poetry",
    "Screenwriting",
  ],
  Gaming: [
    "Video Games",
    "Board Games",
    "Strategy Games",
    "Game Design",
    "Esports",
  ],
  Cooking: [
    "Baking",
    "International Cuisine",
    "Healthy Cooking",
    "Food Science",
  ],
  Other: [],
};

// Interest category icons and colors
const CATEGORY_STYLES: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  Music: {
    icon: "🎵",
    color: "text-purple-700",
    bgColor: "bg-purple-100 hover:bg-purple-200",
  },
  Sports: {
    icon: "⚽",
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200",
  },
  Math: {
    icon: "🔢",
    color: "text-blue-700",
    bgColor: "bg-blue-100 hover:bg-blue-200",
  },
  Communication: {
    icon: "💬",
    color: "text-orange-700",
    bgColor: "bg-orange-100 hover:bg-orange-200",
  },
  Creativity: {
    icon: "🎨",
    color: "text-pink-700",
    bgColor: "bg-pink-100 hover:bg-pink-200",
  },
  Technical: {
    icon: "💻",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100 hover:bg-indigo-200",
  },
  Health: {
    icon: "🏃",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100 hover:bg-emerald-200",
  },
  Science: {
    icon: "🔬",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100 hover:bg-cyan-200",
  },
  Languages: {
    icon: "🌍",
    color: "text-teal-700",
    bgColor: "bg-teal-100 hover:bg-teal-200",
  },
  Arts: {
    icon: "🎭",
    color: "text-rose-700",
    bgColor: "bg-rose-100 hover:bg-rose-200",
  },
  Reading: {
    icon: "📚",
    color: "text-amber-700",
    bgColor: "bg-amber-100 hover:bg-amber-200",
  },
  Writing: {
    icon: "✍️",
    color: "text-slate-700",
    bgColor: "bg-slate-100 hover:bg-slate-200",
  },
  Gaming: {
    icon: "🎮",
    color: "text-violet-700",
    bgColor: "bg-violet-100 hover:bg-violet-200",
  },
  Cooking: {
    icon: "👨‍🍳",
    color: "text-red-700",
    bgColor: "bg-red-100 hover:bg-red-200",
  },
  Other: {
    icon: "✨",
    color: "text-gray-700",
    bgColor: "bg-gray-100 hover:bg-gray-200",
  },
};

export function InterestSelectionStep({
  onNext,
  initialSelected = [],
  initialSubcategories = {},
}: InterestSelectionStepProps) {
  const [selectedInterests, setSelectedInterests] =
    useState<string[]>(initialSelected);
  const [subcategories, setSubcategories] =
    useState<Record<string, string>>(initialSubcategories);
  const [showSubcategoryFor, setShowSubcategoryFor] = useState<string | null>(
    null
  );

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove interest
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
      setSubcategories((prev) => {
        const newSubcategories = { ...prev };
        delete newSubcategories[interest];
        return newSubcategories;
      });
      if (showSubcategoryFor === interest) {
        setShowSubcategoryFor(null);
      }
    } else {
      // Add interest (max 8)
      if (selectedInterests.length < 8) {
        setSelectedInterests((prev) => [...prev, interest]);
        // Show subcategory selection if available
        if (SUBCATEGORIES[interest]?.length > 0) {
          setShowSubcategoryFor(interest);
        }
      }
    }
  };

  const handleSubcategorySelect = (interest: string, subcategory: string) => {
    setSubcategories((prev) => ({
      ...prev,
      [interest]: subcategory,
    }));
    setShowSubcategoryFor(null);
  };

  const handleNext = () => {
    if (selectedInterests.length > 0) {
      onNext(selectedInterests, subcategories);
    }
  };

  const canProceed = selectedInterests.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          What are you interested in? 🌟
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose up to 8 areas that spark your curiosity. Don&apos;t worry - you
          can always change these later!
        </p>
        <div className="mt-4 text-sm text-gray-500">
          {selectedInterests.length}/8 selected
        </div>
      </div>

      {/* Interest Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {INTEREST_CATEGORIES.map((category) => {
          const isSelected = selectedInterests.includes(category);
          const isDisabled = !isSelected && selectedInterests.length >= 8;
          const style = CATEGORY_STYLES[category];

          return (
            <button
              key={category}
              onClick={() => handleInterestToggle(category)}
              disabled={isDisabled}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : isDisabled
                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                    : `border-gray-200 ${style.bgColor} hover:border-gray-300 hover:shadow-sm`
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Category Content */}
              <div className="space-y-2">
                <div className="text-3xl">{style.icon}</div>
                <div>
                  <h3 className={`font-semibold ${style.color}`}>{category}</h3>
                  {subcategories[category] && (
                    <p className="text-sm text-gray-600 mt-1">
                      {subcategories[category]}
                    </p>
                  )}
                </div>
              </div>

              {/* Subcategory Button */}
              {isSelected && SUBCATEGORIES[category]?.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubcategoryFor(category);
                  }}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {subcategories[category]
                    ? "Change specialty"
                    : "Add specialty"}
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategory Selection Modal */}
      {showSubcategoryFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Choose a {showSubcategoryFor} specialty
            </h3>
            <div className="space-y-2">
              {SUBCATEGORIES[showSubcategoryFor]?.map((subcategory) => (
                <button
                  key={subcategory}
                  onClick={() =>
                    handleSubcategorySelect(showSubcategoryFor, subcategory)
                  }
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {subcategory}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowSubcategoryFor(null)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-500">
          {selectedInterests.length === 0 &&
            "Select at least one interest to continue"}
          {selectedInterests.length > 0 &&
            selectedInterests.length < 5 &&
            "Great start! You can add more if you'd like"}
          {selectedInterests.length >= 5 &&
            "Perfect! You have a nice variety of interests"}
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all duration-200
            ${
              canProceed
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          Next: Assess Skills →
        </button>
      </div>
    </div>
  );
}
