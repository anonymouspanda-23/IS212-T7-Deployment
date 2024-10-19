import getModels from "@/models";

export async function up(): Promise<void> {
  try {
    const { Request } = await getModels();
    await Request.updateMany(
      { performedBy: { $exists: false } }, 
      { $set: { performedBy: null } } 
    );
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

export async function down(): Promise<void> {
  try {
    const { Request } = await getModels();
    await Request.updateMany(
      { performedBy: { $exists: true } },
      { $unset: { performedBy: "" } }
    );
  } catch (err) {
    console.error("Rollback error:", err);
  }
}
