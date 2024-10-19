import getModels from "@/models";
import { readFileSync } from "fs";
import path from "path";

const filePath = path.resolve(__dirname, "../script/log.json");
const fileContent = readFileSync(filePath, "utf-8");
const logData = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Log } = await getModels();
    for (const data of logData) {
      await Log.create(data);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
