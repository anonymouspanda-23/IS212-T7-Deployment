import getModels from "@/models";
import path from "path";
import { readFileSync } from "fs";

// npx migrate create init-employee-table
// npx migrate up init-employee-table

const filePath = path.resolve(__dirname, "../script/employee.json");
const fileContent = readFileSync(filePath, "utf-8");
const employees = JSON.parse(fileContent);

export async function up(): Promise<void> {
  try {
    const { Employee } = await getModels();
    for (const employeeData of employees) {
      await Employee.create(employeeData);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
