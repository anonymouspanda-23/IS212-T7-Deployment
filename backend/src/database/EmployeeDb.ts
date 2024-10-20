import Employee, { IEmployee } from "@/models/Employee";
import EmployeeTreeNode from "@/models/EmployeeTreeNode";

class EmployeeDb {
  public async getEmployee(staffId: number): Promise<IEmployee | null> {
    const employee = await Employee.findOne(
      { staffId },
      "-_id -createdAt -updatedAt -hashedPassword",
    );
    return employee;
  }

  public async getEmployeeByEmail(userEmail: string): Promise<any> {
    return await Employee.findOne(
      {
        email: userEmail,
      },
      "-_id -createdAt -updatedAt",
    ).exec();
  }

  public async getAllDeptTeamCount() {
    const result = await Employee.aggregate([
      {
        $group: {
          _id: { dept: "$dept", position: "$position" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.dept": 1, "_id.position": 1 },
      },
    ]);

    let sanitisedResult: any = {};

    result.forEach((item) => {
      const department = item._id.dept;
      const position = item._id.position;
      const count = item.count;

      if (!sanitisedResult[department]) {
        sanitisedResult[department] = { teams: {} };
      }

      sanitisedResult[department].teams[position] = count;
      sanitisedResult[department].wfhStaff = [];
    });

    return sanitisedResult;
  }

  public async getDeptByManager(staffId: number) {
    const employeeHierarchy = await Employee.aggregate([
      { $match: { staffId } },
      {
        $graphLookup: {
          from: "employees",
          startWith: staffId,
          connectFromField: "staffId",
          connectToField: "reportingManager",
          as: "subordinates",
          maxDepth: 100,
          depthField: "level",
        },
      },
    ]);

    if (employeeHierarchy.length === 0) {
      throw new Error("Employee not found");
    }

    const root = new EmployeeTreeNode(
      employeeHierarchy[0].staffId,
      employeeHierarchy[0].dept,
      null,
    );

    let queue: Array<EmployeeTreeNode> = [root];
    let seen: Array<number> = [root.getEmployee()];
    let subordinates = employeeHierarchy[0].subordinates;

    while (queue.length > 0) {
      let current: EmployeeTreeNode | undefined = queue.shift();

      if (current === undefined) {
        continue;
      }

      const directSubordinates = subordinates.filter(
        (sub: any) => sub.reportingManager === current.getEmployee(),
      );

      for (const subordinate of directSubordinates) {
        const subordinateStaffId = subordinate.staffId;
        const subordinateDept = subordinate.dept;
        if (subordinateStaffId in seen) {
          continue;
        }

        seen.push(subordinateStaffId);
        const subordinateTreeNode = new EmployeeTreeNode(
          subordinateStaffId,
          subordinateDept,
          null,
        );

        current.addSubordinate(subordinateTreeNode);
        queue.push(subordinateTreeNode);
      }
    }

    return root;
  }

  public async getRoleOneOrThreeEmployees(): Promise<IEmployee[]> {
    const employees = await Employee.aggregate([
      { $match: { role: { $in: [1, 3] } } },
      {
        $project: {
          _id: 0,
          staffId: 1,
          staffName: { $concat: ["$staffFName", " ", "$staffLName"] },
          dept: 1,
          position: 1,
          email: 1,
          role: 1,
        },
      },
    ]);

    return employees;
  }
}

export default EmployeeDb;
