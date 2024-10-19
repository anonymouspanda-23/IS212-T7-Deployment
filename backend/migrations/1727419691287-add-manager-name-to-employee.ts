import getModels from "@/models";

export async function up(): Promise<void> {
  try {
    const { Employee } = await getModels();
    const employeesWithManagers = await Employee.find({
      reportingManager: { $exists: true, $ne: null },
    });

    for (const employee of employeesWithManagers) {
      const manager = await Employee.findOne({
        staffId: employee.reportingManager,
      });

      const { staffFName, staffLName } = manager!;
      const managerName = `${staffFName} ${staffLName}`;

      await Employee.updateOne(
        { _id: employee._id },
        { $set: { reportingManagerName: managerName } }
      );

      console.log(
        `Add ${employee.staffFName} ${employee.staffLName}'s manager name - ${managerName}`
      );
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

export async function down(): Promise<void> {
  try {
    const { Employee } = await getModels();
    await Employee.updateMany({}, { $unset: { reportingManagerName: "" } });
  } catch (err) {
    console.error("Rollback error:", err);
  }
}
