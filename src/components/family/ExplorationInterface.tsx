"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  MessageCircle,
  Target,
  Compass,
  Heart,
  Star,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import SharedGoalSetting from "./SharedGoalSetting";

interface Interest {
  category: string;
  subcategory?: string;
  currentLevel: number;
  intentLevel: string;
  lastUpdated: string;
}

interface DiscussionPrompt {
  id: string;
  category: string;
  prompt: string;
  type: "exploration" | "encouragement" | "goal_setting" | "reflection";
  ageAppropriate: boolean;
}

interface ExplorationSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeCommitment: string;
  resources: string[];
}

interface ExplorationInterfaceProps {
  childUserId: string;
  childInterests: Interest[];
  childAge: number;
}

export default function ExplorationInterface({
  childUserId,
  childInterests,
  childAge,
}: ExplorationInterfaceProps) {
  const [discussionPrompts, setDiscussionPrompts] = useState<
    DiscussionPrompt[]
  >([]);
  const [explorationSuggestions, setExplorationSuggestions] = useState<
    ExplorationSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateDiscussionPrompts();
    generateExplorationSuggestions();
  }, [
    childInterests,
    childAge,
    generateDiscussionPrompts,
    generateExplorationSuggestions,
  ]);

  const generateDiscussionPrompts = () => {
    const prompts: DiscussionPrompt[] = [];

    // Generate prompts based on child's interests
    childInterests.forEach((interest, index) => {
      const categoryPrompts = getPromptsForCategory(
        interest.category,
        interest.currentLevel,
        childAge
      );
      prompts.push(
        ...categoryPrompts.map((prompt) => ({
          id: `${interest.category}-${index}-${prompt.type}`,
          category: interest.category,
          ...prompt,
        }))
      );
    });

    // Add general exploration prompts
    const generalPrompts = getGeneralExplorationPrompts(childAge);
    prompts.push(...generalPrompts);

    setDiscussionPrompts(prompts);
  };

  const generateExplorationSuggestions = () => {
    const suggestions: ExplorationSuggestion[] = [];

    // Generate suggestions based on interests
    childInterests.forEach((interest) => {
      const categorySuggestions = getSuggestionsForCategory(
        interest.category,
        interest.currentLevel
      );
      suggestions.push(...categorySuggestions);
    });

    // Add cross-category suggestions
    const crossCategorySuggestions =
      getCrossCategorySuggestions(childInterests);
    suggestions.push(...crossCategorySuggestions);

    setExplorationSuggestions(suggestions);
    setIsLoading(false);
  };

  const getPromptsForCategory = (
    category: string,
    level: number,
    age: number
  ): Omit<DiscussionPrompt, "id" | "category">[] => {
    const basePrompts = {
      Music: [
        {
          prompt: "What kind of music makes you feel most excited or happy?",
          type: "exploration" as const,
          ageAppropriate: age >= 6,
        },
        {
          prompt:
            "Would you like to try learning a new instrument or exploring a different music style?",
          type: "goal_setting" as const,
          ageAppropriate: age >= 8,
        },
        {
          prompt: "How does music help you express yourself?",
          type: "reflection" as const,
          ageAppropriate: age >= 10,
        },
      ],
      Sports: [
        {
          prompt:
            "What physical activities make you feel strong and confident?",
          type: "exploration" as const,
          ageAppropriate: age >= 6,
        },
        {
          prompt:
            "Would you be interested in trying a team sport or individual activity?",
          type: "goal_setting" as const,
          ageAppropriate: age >= 8,
        },
        {
          prompt: "How do you feel after being physically active?",
          type: "reflection" as const,
          ageAppropriate: age >= 8,
        },
      ],
      Technical: [
        {
          prompt:
            "What kind of problems would you like to solve with technology?",
          type: "exploration" as const,
          ageAppropriate: age >= 10,
        },
        {
          prompt:
            "Would you like to build something cool with code or technology?",
          type: "goal_setting" as const,
          ageAppropriate: age >= 12,
        },
        {
          prompt: "How do you think technology can help make the world better?",
          type: "reflection" as const,
          ageAppropriate: age >= 12,
        },
      ],
      Creativity: [
        {
          prompt: "What creative projects make you lose track of time?",
          type: "exploration" as const,
          ageAppropriate: age >= 6,
        },
        {
          prompt: "Would you like to try a new art form or creative medium?",
          type: "goal_setting" as const,
          ageAppropriate: age >= 8,
        },
        {
          prompt: "How does creating something make you feel?",
          type: "reflection" as const,
          ageAppropriate: age >= 8,
        },
      ],
    };

    return basePrompts[category as keyof typeof basePrompts] || [];
  };

  const getGeneralExplorationPrompts = (age: number): DiscussionPrompt[] => {
    const prompts = [
      {
        id: "general-curiosity",
        category: "General",
        prompt:
          "What's something you've always been curious about but haven't tried yet?",
        type: "exploration" as const,
        ageAppropriate: age >= 8,
      },
      {
        id: "general-strength",
        category: "General",
        prompt: "What do you think you're naturally good at?",
        type: "encouragement" as const,
        ageAppropriate: age >= 6,
      },
      {
        id: "general-challenge",
        category: "General",
        prompt: "What's something challenging you'd like to get better at?",
        type: "goal_setting" as const,
        ageAppropriate: age >= 8,
      },
      {
        id: "general-growth",
        category: "General",
        prompt: "How have you grown or changed in the past few months?",
        type: "reflection" as const,
        ageAppropriate: age >= 10,
      },
    ];

    return prompts.filter((prompt) => prompt.ageAppropriate);
  };

  const getSuggestionsForCategory = (
    category: string,
    level: number
  ): ExplorationSuggestion[] => {
    const suggestions = {
      Music: [
        {
          id: `music-${level}-1`,
          title: "Explore New Genres",
          description:
            "Listen to different music styles and find what resonates with you",
          category: "Music",
          difficulty:
            level <= 2 ? ("beginner" as const) : ("intermediate" as const),
          timeCommitment: "15-30 minutes daily",
          resources: [
            "Spotify playlists",
            "YouTube music channels",
            "Local radio stations",
          ],
        },
        {
          id: `music-${level}-2`,
          title: "Try a New Instrument",
          description:
            "Experiment with different instruments to find your favorite",
          category: "Music",
          difficulty: "beginner" as const,
          timeCommitment: "30 minutes, 2-3 times per week",
          resources: [
            "Local music stores",
            "Online tutorials",
            "Music teacher",
          ],
        },
      ],
      Sports: [
        {
          id: `sports-${level}-1`,
          title: "Try a New Sport",
          description:
            "Explore different physical activities to find what you enjoy",
          category: "Sports",
          difficulty: "beginner" as const,
          timeCommitment: "1 hour per week",
          resources: [
            "Local sports clubs",
            "Community centers",
            "YouTube tutorials",
          ],
        },
        {
          id: `sports-${level}-2`,
          title: "Set a Fitness Goal",
          description: "Work towards a specific physical achievement",
          category: "Sports",
          difficulty:
            level <= 2 ? ("beginner" as const) : ("intermediate" as const),
          timeCommitment: "30 minutes, 3-4 times per week",
          resources: ["Fitness apps", "Local gym", "Sports coach"],
        },
      ],
      Technical: [
        {
          id: `tech-${level}-1`,
          title: "Build Your First App",
          description: "Create a simple application or website",
          category: "Technical",
          difficulty:
            level <= 1 ? ("beginner" as const) : ("intermediate" as const),
          timeCommitment: "1-2 hours per week",
          resources: [
            "Scratch programming",
            "Code.org",
            "Local coding classes",
          ],
        },
        {
          id: `tech-${level}-2`,
          title: "Learn About AI",
          description:
            "Explore how artificial intelligence works and its applications",
          category: "Technical",
          difficulty: "intermediate" as const,
          timeCommitment: "30 minutes per week",
          resources: [
            "Educational videos",
            "AI for kids books",
            "Interactive demos",
          ],
        },
      ],
    };

    return suggestions[category as keyof typeof suggestions] || [];
  };

  const getCrossCategorySuggestions = (
    interests: Interest[]
  ): ExplorationSuggestion[] => {
    if (interests.length < 2) return [];

    return [
      {
        id: "cross-creative-tech",
        title: "Digital Art Project",
        description:
          "Combine creativity and technology to create digital artwork",
        category: "Cross-Category",
        difficulty: "intermediate" as const,
        timeCommitment: "1 hour per week",
        resources: ["Digital art apps", "Online tutorials", "Art communities"],
      },
      {
        id: "cross-music-tech",
        title: "Music Production",
        description: "Use technology to create and produce your own music",
        category: "Cross-Category",
        difficulty: "intermediate" as const,
        timeCommitment: "1-2 hours per week",
        resources: [
          "GarageBand",
          "Music production software",
          "Online courses",
        ],
      },
    ];
  };

  const getPromptIcon = (type: string) => {
    switch (type) {
      case "exploration":
        return <Compass className="h-4 w-4" />;
      case "encouragement":
        return <Heart className="h-4 w-4" />;
      case "goal_setting":
        return <Target className="h-4 w-4" />;
      case "reflection":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPromptColor = (type: string) => {
    switch (type) {
      case "exploration":
        return "bg-blue-100 text-blue-800";
      case "encouragement":
        return "bg-pink-100 text-pink-800";
      case "goal_setting":
        return "bg-green-100 text-green-800";
      case "reflection":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Generating exploration ideas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Exploration & Discovery
          </CardTitle>
          <CardDescription className="text-purple-700">
            Ideas and conversation starters to help support your child's growth
            journey
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="prompts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Discussion Prompts
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Exploration Ideas
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Shared Goals
          </TabsTrigger>
        </TabsList>

        {/* Discussion Prompts Tab */}
        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Starters</CardTitle>
              <CardDescription>
                Questions to help you understand and support your child's
                interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discussionPrompts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No discussion prompts available. Add some interests to get
                  personalized suggestions.
                </p>
              ) : (
                <div className="space-y-4">
                  {discussionPrompts.map((prompt) => (
                    <div key={prompt.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getPromptIcon(prompt.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPromptColor(prompt.type)}>
                              {prompt.type.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline">{prompt.category}</Badge>
                          </div>
                          <p className="text-sm font-medium mb-2">
                            {prompt.prompt}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            💡 This question encourages{" "}
                            {prompt.type === "exploration"
                              ? "curiosity and discovery"
                              : prompt.type === "encouragement"
                              ? "confidence and self-awareness"
                              : prompt.type === "goal_setting"
                              ? "planning and ambition"
                              : "thoughtful reflection"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exploration Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Exploration Ideas</CardTitle>
              <CardDescription>
                Activities and projects to help your child discover new
                interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {explorationSuggestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No exploration suggestions available. Add some interests to
                  get personalized ideas.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {explorationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.difficulty}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3" />
                          <span className="font-medium">Time:</span>
                          <span>{suggestion.timeCommitment}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-3 w-3" />
                            <span className="font-medium">Resources:</span>
                          </div>
                          <ul className="text-muted-foreground ml-5 space-y-1">
                            {suggestion.resources.map((resource, index) => (
                              <li key={index}>• {resource}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared Goals Tab */}
        <TabsContent value="goals">
          <SharedGoalSetting
            relationshipId="temp-relationship-id" // This would be passed as a prop
            isParent={true} // This would be determined from user context
            childInterests={interests.map((i) => i.category)}
          />
        </TabsContent>
      </Tabs>

      {/* Exploration Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">
                Supporting Exploration
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Focus on curiosity and discovery rather than performance
                </li>
                <li>• Celebrate effort and learning, not just results</li>
                <li>
                  • Let your child lead the conversation and follow their
                  interests
                </li>
                <li>
                  • Create a safe space for them to share what excites them
                </li>
                <li>
                  • Remember that interests can change and evolve over time
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
