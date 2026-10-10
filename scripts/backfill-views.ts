import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting backfill of null blog views...");

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

    console.log("Successfully backfilled blog views");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error backfilling views:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
