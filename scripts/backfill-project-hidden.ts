import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting backfill of project.hidden...");

  try {
    const result = await prisma.$runCommandRaw({
      update: "Project",
      updates: [
        {
          q: { hidden: { $exists: false } },
          u: { $set: { hidden: false } },
          multi: true,
        },
      ],
    });

    console.log("Successfully backfilled project.hidden");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error backfilling project.hidden:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
