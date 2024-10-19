import getModels from "@/models";
import { readFileSync } from "fs";
import path from "path";

const filePath = path.resolve(__dirname, "../script/employee.json");
const fileContent = readFileSync(filePath, "utf-8");
const employees = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Employee } = await getModels();
    for (const employeeData of employees) {
      await Employee.updateOne(
        { staffId: employeeData.staffId },
        { $set: employeeData },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
