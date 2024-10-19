import getModels from "@/models";
import path from "path";
import { readFileSync } from "fs";

// npx migrate create init-request-table
// npx migrate up init-request-table

const filePath = path.resolve(__dirname, "../script/request.json");
const fileContent = readFileSync(filePath, "utf-8");
const requests = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Request } = await getModels();
    for (const requestData of requests) {
      await Request.create(requestData);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
