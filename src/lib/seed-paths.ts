import { sql } from "./db";
import { ADDITIONAL_PREDEFINED_PATHS } from "./path-management";

export async function seedAdditionalPaths() {
  try {
    console.log("Seeding additional predefined paths...");

    for (const pathData of ADDITIONAL_PREDEFINED_PATHS) {
      // Check if path already exists
      const existing = await sql`
        SELECT id FROM predefined_paths 
        WHERE interest_category = ${pathData.interestCategory} 
        AND path_name = ${pathData.pathName}
      `;

      if (existing.length > 0) {
        console.log(`Path "${pathData.pathName}" already exists, skipping...`);
        continue;
      }

      // Insert new path
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
        )
        VALUES (
          ${pathData.interestCategory},
          ${pathData.pathName},
          ${pathData.description},
          ${pathData.ageRangeMin},
          ${pathData.ageRangeMax},
          ${pathData.intentLevels},
          ${JSON.stringify(pathData.stages)},
          ${JSON.stringify(pathData.synergies)}
        )
      `;

      console.log(`✓ Seeded path: ${pathData.pathName}`);
    }

    console.log("Additional paths seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding additional paths:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAdditionalPaths()
    .then(() => {
      console.log("Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
