import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { createInterface } from "readline/promises";

const signup = async () => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const email = await rl.question("Enter email: ");
  const password = await rl.question("Enter password: ");

  if (!email || !password) {
    console.error("Email and password are required");
    return;
  }

  if (!email.includes("@")) {
    console.error("Invalid email format");
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      console.log("User already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    console.log("✅ User created successfully!");
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    return;
  } catch (error) {
    console.error("Error during signup:", error);
    return;
  }
};

signup()
  .then(() => {
    console.log("Signup process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in signup script:", error);
    process.exit(1);
  });
