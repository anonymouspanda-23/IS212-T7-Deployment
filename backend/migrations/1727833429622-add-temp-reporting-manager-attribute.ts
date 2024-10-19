import getModels from "@/models";

export async function up(): Promise<void> {
  try {
    const { Employee } = await getModels();
    const users = await Employee.find();

    for (const user of users) {
      user.tempReportingManager = null;
      user.tempReportingManagerName = null;
      console.log("Adding tempReportingManager & tempReportingManagerName");
      await user.save();
    }
  } catch (err) {
    console.log("Migration Error:", err);
  }
}

export async function down(): Promise<void> {
  // Write migration here
}
