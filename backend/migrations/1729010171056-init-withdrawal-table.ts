import getModels from "@/models";
import path from "path";
import { readFileSync } from "fs";

// npx migrate create init-withdrawal-table
// npx migrate up init-withdrawal-table

const filePath = path.resolve(__dirname, "../script/withdrawal.json");
const fileContent = readFileSync(filePath, "utf-8");
const withdrawals = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Withdrawal } = await getModels();
    for (const withdrawalData of withdrawals) {
      await Withdrawal.create(withdrawalData);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
