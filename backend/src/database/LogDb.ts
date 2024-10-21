import Log from "@/models/Log";

class LogDb {
  public async logAction(logAction: any): Promise<void> {
    await Log.create(logAction);
  }

  public async getLogs() {
    const logData = await Log.aggregate([
      {
        $project: {
          _id: 0,
          performedBy: 1,
          staffName: 1,
          requestId: 1,
          requestType: 1,
          action: 1,
          dept: 1,
          position: 1,
          reason: 1,
          createdAt: 1,
          logId: 1,
        },
      },
      {
        $group: {
          _id: {
            dept: "$dept",
            position: "$position",
          },
          logs: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          dept: "$_id.dept",
          position: "$_id.position",
          logs: 1,
        },
      },
    ]);

    const formattedLogs = logData.reduce((acc: any, entry: any) => {
      if (!acc[entry.dept]) {
        acc[entry.dept] = {};
      }

      if (!acc[entry.dept][entry.position]) {
        acc[entry.dept][entry.position] = [];
      }
      acc[entry.dept][entry.position].push(...entry.logs);
      return acc;
    }, {});

    return formattedLogs;
  }
}

export default LogDb;
