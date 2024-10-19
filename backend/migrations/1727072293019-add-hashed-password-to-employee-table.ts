import getModels from "@/models";
import bcrypt from "bcrypt";

export async function up(): Promise<void> {
  try {
    const saltRounds = 10;
    const DUMMY_PASSWORD = "password123"; // all users to have the same password

    const { Employee } = await getModels();
    const users = await Employee.find();

    for (const user of users) {
      if (!user.hashedPassword) {
        const hashedPassword = await bcrypt.hash(DUMMY_PASSWORD, saltRounds);
        user.hashedPassword = hashedPassword;
        console.log(`User ${user.staffFName} password has been hashed`);
        await user.save();
      }
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
