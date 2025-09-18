const { seedAdditionalPaths } = require("./src/lib/seed-paths.ts");

async function runSeed() {
  try {
    await seedAdditionalPaths();
    console.log("Paths seeded successfully!");
  } catch (error) {
    console.error("Error seeding paths:", error);
  }
}

runSeed();
