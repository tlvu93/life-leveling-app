import { sql } from "./db";
import { CommitmentLevel, SkillLevel } from "@/types";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing seed data (but keep user data)
    await sql`DELETE FROM predefined_paths WHERE id IN (
      SELECT id FROM predefined_paths 
      WHERE description LIKE '%Sample path for%'
    )`;

    // Insert comprehensive predefined paths
    const paths = [
      // Music paths
      {
        category: "Music",
        name: "Instrumental Journey",
        description:
          "Learn and master a musical instrument from beginner to advanced levels",
        ageMin: 6,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Explore Instruments",
            description: "Try different instruments to find your favorite",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Basic Skills",
            description: "Learn fundamental techniques and simple songs",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Intermediate Player",
            description: "Play more complex pieces and understand music theory",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Advanced Musician",
            description: "Perform publicly or teach others",
            requirements: { level: 4 },
          },
        ],
        synergies: { Math: 0.2, Creativity: 0.3 },
      },
      {
        category: "Music",
        name: "Vocal Development",
        description: "Develop singing skills and vocal performance abilities",
        ageMin: 8,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Find Your Voice",
            description: "Learn basic breathing and vocal exercises",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Song Basics",
            description: "Learn to sing simple songs with proper technique",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Performance Ready",
            description: "Develop stage presence and advanced vocal techniques",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Vocal Artist",
            description: "Record music or perform professionally",
            requirements: { level: 4 },
          },
        ],
        synergies: { Communication: 0.3, Creativity: 0.2 },
      },

      // Sports paths
      {
        category: "Sports",
        name: "Athletic Development",
        description:
          "Build physical fitness and sports skills across various activities",
        ageMin: 6,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Try Different Sports",
            description:
              "Explore various physical activities to find what you enjoy",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Choose Your Sport",
            description: "Focus on 1-2 sports you enjoy most and build skills",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Competitive Player",
            description: "Join teams or compete in local events",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Elite Athlete",
            description: "Coach others or compete at high levels",
            requirements: { level: 4 },
          },
        ],
        synergies: { Health: 0.4, Communication: 0.2 },
      },
      {
        category: "Sports",
        name: "Team Sports Mastery",
        description: "Specialize in team-based sports and leadership",
        ageMin: 8,
        ageMax: 99,
        intentLevels: ["average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Learn the Game",
            description: "Understand rules and basic strategies",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Team Player",
            description: "Develop teamwork and communication skills",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Team Leader",
            description: "Take on leadership roles and mentor others",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Coach/Captain",
            description: "Lead teams and develop strategy",
            requirements: { level: 4 },
          },
        ],
        synergies: { Communication: 0.4, Health: 0.3 },
      },

      // Technical paths
      {
        category: "Technical",
        name: "Programming Path",
        description: "Learn to code and build software applications",
        ageMin: 10,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Code Basics",
            description:
              "Learn your first programming language and basic concepts",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Build Projects",
            description: "Create simple applications and websites",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Advanced Developer",
            description: "Work on complex systems and learn frameworks",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Tech Expert",
            description: "Lead projects or start your own tech company",
            requirements: { level: 4 },
          },
        ],
        synergies: { Math: 0.3, Creativity: 0.2 },
      },
      {
        category: "Technical",
        name: "Digital Creator",
        description:
          "Create digital content, websites, and multimedia projects",
        ageMin: 12,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Digital Tools",
            description: "Learn basic digital creation tools and software",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Content Creator",
            description: "Create and share digital content regularly",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Professional Creator",
            description: "Build audience and monetize your content",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Digital Entrepreneur",
            description: "Run your own digital business or agency",
            requirements: { level: 4 },
          },
        ],
        synergies: { Creativity: 0.4, Communication: 0.3 },
      },

      // Math paths
      {
        category: "Math",
        name: "Mathematical Thinking",
        description: "Develop problem-solving and analytical thinking skills",
        ageMin: 6,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Number Sense",
            description: "Build comfort with numbers and basic operations",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Problem Solver",
            description: "Apply math to solve real-world problems",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Advanced Concepts",
            description: "Master algebra, geometry, and advanced topics",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Math Expert",
            description: "Tutor others or pursue mathematical research",
            requirements: { level: 4 },
          },
        ],
        synergies: { Technical: 0.4, Science: 0.3 },
      },

      // Communication paths
      {
        category: "Communication",
        name: "Public Speaking",
        description:
          "Develop confidence and skills in public speaking and presentation",
        ageMin: 8,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Overcome Fear",
            description: "Build confidence speaking in front of small groups",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Clear Communicator",
            description: "Deliver organized presentations with confidence",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Engaging Speaker",
            description: "Captivate audiences and handle Q&A sessions",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Professional Speaker",
            description: "Speak at conferences or teach presentation skills",
            requirements: { level: 4 },
          },
        ],
        synergies: { Music: 0.2, Arts: 0.2 },
      },

      // Creativity paths
      {
        category: "Creativity",
        name: "Visual Arts",
        description:
          "Explore and develop skills in drawing, painting, and visual design",
        ageMin: 6,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Art Exploration",
            description: "Try different art mediums and find your style",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Skill Building",
            description: "Develop technique and create regular artwork",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Artistic Voice",
            description: "Develop your unique style and share your work",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Professional Artist",
            description: "Sell artwork or teach others",
            requirements: { level: 4 },
          },
        ],
        synergies: { Technical: 0.2, Communication: 0.2 },
      },

      // Health paths
      {
        category: "Health",
        name: "Wellness Journey",
        description: "Build healthy habits for physical and mental well-being",
        ageMin: 6,
        ageMax: 99,
        intentLevels: ["casual", "average", "invested", "competitive"],
        stages: [
          {
            stage: 1,
            name: "Healthy Habits",
            description: "Establish basic nutrition and exercise routines",
            requirements: { level: 1 },
          },
          {
            stage: 2,
            name: "Active Lifestyle",
            description: "Maintain consistent healthy practices",
            requirements: { level: 2 },
          },
          {
            stage: 3,
            name: "Wellness Advocate",
            description: "Help others adopt healthy lifestyles",
            requirements: { level: 3 },
          },
          {
            stage: 4,
            name: "Health Expert",
            description: "Become a certified trainer or nutritionist",
            requirements: { level: 4 },
          },
        ],
        synergies: { Sports: 0.4, Cooking: 0.3 },
      },
    ];

    // Insert all paths
    for (const path of paths) {
      await sql`
        INSERT INTO predefined_paths (
          interest_category, 
          path_name, 
          description, 
          age_range_min, 
          age_range_max, 
          intent_levels, 
          stages, 
          synergies
        ) VALUES (
          ${path.category},
          ${path.name},
          ${path.description},
          ${path.ageMin},
          ${path.ageMax},
          ${path.intentLevels},
          ${JSON.stringify(path.stages)},
          ${JSON.stringify(path.synergies)}
        )
      `;
    }

    // Seed some sample cohort stats for testing
    const cohortStats = [
      // Music stats
      {
        ageMin: 6,
        ageMax: 12,
        category: "Music",
        intent: "casual",
        level: 1,
        count: 150,
        percentiles: { 25: 1, 50: 1, 75: 2, 90: 2 },
      },
      {
        ageMin: 6,
        ageMax: 12,
        category: "Music",
        intent: "casual",
        level: 2,
        count: 80,
        percentiles: { 25: 1, 50: 2, 75: 2, 90: 3 },
      },
      {
        ageMin: 13,
        ageMax: 17,
        category: "Music",
        intent: "invested",
        level: 2,
        count: 120,
        percentiles: { 25: 2, 50: 2, 75: 3, 90: 3 },
      },
      {
        ageMin: 13,
        ageMax: 17,
        category: "Music",
        intent: "invested",
        level: 3,
        count: 60,
        percentiles: { 25: 2, 50: 3, 75: 3, 90: 4 },
      },

      // Sports stats
      {
        ageMin: 6,
        ageMax: 12,
        category: "Sports",
        intent: "average",
        level: 1,
        count: 200,
        percentiles: { 25: 1, 50: 1, 75: 2, 90: 2 },
      },
      {
        ageMin: 6,
        ageMax: 12,
        category: "Sports",
        intent: "average",
        level: 2,
        count: 120,
        percentiles: { 25: 1, 50: 2, 75: 2, 90: 3 },
      },
      {
        ageMin: 13,
        ageMax: 17,
        category: "Sports",
        intent: "competitive",
        level: 3,
        count: 80,
        percentiles: { 25: 2, 50: 3, 75: 3, 90: 4 },
      },

      // Technical stats
      {
        ageMin: 13,
        ageMax: 17,
        category: "Technical",
        intent: "invested",
        level: 1,
        count: 90,
        percentiles: { 25: 1, 50: 1, 75: 2, 90: 2 },
      },
      {
        ageMin: 13,
        ageMax: 17,
        category: "Technical",
        intent: "invested",
        level: 2,
        count: 70,
        percentiles: { 25: 1, 50: 2, 75: 2, 90: 3 },
      },
      {
        ageMin: 18,
        ageMax: 25,
        category: "Technical",
        intent: "competitive",
        level: 3,
        count: 50,
        percentiles: { 25: 2, 50: 3, 75: 3, 90: 4 },
      },
    ];

    for (const stat of cohortStats) {
      await sql`
        INSERT INTO cohort_stats (
          age_range_min, 
          age_range_max, 
          interest_category, 
          intent_level, 
          skill_level, 
          user_count, 
          percentile_data
        ) VALUES (
          ${stat.ageMin},
          ${stat.ageMax},
          ${stat.category},
          ${stat.intent},
          ${stat.level},
          ${stat.count},
          ${JSON.stringify(stat.percentiles)}
        )
        ON CONFLICT (age_range_min, age_range_max, interest_category, intent_level, skill_level)
        DO UPDATE SET 
          user_count = EXCLUDED.user_count,
          percentile_data = EXCLUDED.percentile_data,
          updated_at = NOW()
      `;
    }

    console.log("Database seeding completed successfully!");
    console.log(`- Inserted ${paths.length} predefined paths`);
    console.log(`- Inserted ${cohortStats.length} cohort statistics`);

    return true;
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
}

export async function clearSeedData() {
  try {
    console.log("Clearing seed data...");

    // Clear predefined paths (but keep any user-created ones)
    await sql`DELETE FROM predefined_paths`;

    // Clear cohort stats
    await sql`DELETE FROM cohort_stats`;

    console.log("Seed data cleared successfully!");
    return true;
  } catch (error) {
    console.error("Failed to clear seed data:", error);
    throw error;
  }
}

// Helper function to generate realistic cohort data
export async function generateCohortStats() {
  try {
    console.log("Generating cohort statistics...");

    const categories = [
      "Music",
      "Sports",
      "Technical",
      "Math",
      "Communication",
      "Creativity",
      "Health",
    ];
    const intentLevels: CommitmentLevel[] = [
      "casual",
      "average",
      "invested",
      "competitive",
    ];
    const ageRanges = [
      { min: 6, max: 12 },
      { min: 13, max: 17 },
      { min: 18, max: 25 },
      { min: 26, max: 35 },
      { min: 36, max: 50 },
      { min: 51, max: 99 },
    ];

    let statsGenerated = 0;

    for (const category of categories) {
      for (const ageRange of ageRanges) {
        for (const intentLevel of intentLevels) {
          for (let skillLevel = 1; skillLevel <= 4; skillLevel++) {
            // Generate realistic user counts based on age, intent, and skill level
            let baseCount = 100;

            // Adjust for age (younger users more common)
            if (ageRange.min >= 18) baseCount *= 0.7;
            if (ageRange.min >= 36) baseCount *= 0.5;

            // Adjust for intent level
            if (intentLevel === "competitive") baseCount *= 0.3;
            else if (intentLevel === "invested") baseCount *= 0.6;
            else if (intentLevel === "casual") baseCount *= 1.2;

            // Adjust for skill level (fewer people at higher levels)
            baseCount *= Math.pow(0.7, skillLevel - 1);

            const userCount = Math.max(
              10,
              Math.floor(baseCount + Math.random() * 50)
            );

            // Generate percentile data
            const percentileData = {
              25: Math.max(1, skillLevel - 1),
              50: skillLevel,
              75: Math.min(4, skillLevel + 1),
              90: Math.min(4, skillLevel + 1),
              95: Math.min(4, skillLevel + 2),
            };

            await sql`
              INSERT INTO cohort_stats (
                age_range_min, 
                age_range_max, 
                interest_category, 
                intent_level, 
                skill_level, 
                user_count, 
                percentile_data
              ) VALUES (
                ${ageRange.min},
                ${ageRange.max},
                ${category},
                ${intentLevel},
                ${skillLevel as SkillLevel},
                ${userCount},
                ${JSON.stringify(percentileData)}
              )
              ON CONFLICT (age_range_min, age_range_max, interest_category, intent_level, skill_level)
              DO UPDATE SET 
                user_count = EXCLUDED.user_count,
                percentile_data = EXCLUDED.percentile_data,
                updated_at = NOW()
            `;

            statsGenerated++;
          }
        }
      }
    }

    console.log(`Generated ${statsGenerated} cohort statistics!`);
    return true;
  } catch (error) {
    console.error("Failed to generate cohort stats:", error);
    throw error;
  }
}
