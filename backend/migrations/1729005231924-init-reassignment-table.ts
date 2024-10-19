import getModels from "@/models";
import { readFileSync } from "fs";
import path from "path";

const filePath = path.resolve(__dirname, "../script/reassignment.json");
const fileContent = readFileSync(filePath, "utf-8");
const reassignmentData = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Reassignment } = await getModels();
    for (const data of reassignmentData) {
      await Reassignment.create(data);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
