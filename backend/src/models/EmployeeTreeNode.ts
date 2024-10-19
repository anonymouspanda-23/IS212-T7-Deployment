class EmployeeTreeNode {
  private readonly employee: number;
  private readonly department: string;
  private subordinates: Array<EmployeeTreeNode> | null;

  public constructor(
    employee: number,
    department: string,
    subordinates: Array<EmployeeTreeNode> | null
  ) {
    this.employee = employee;
    this.department = department;
    this.subordinates = subordinates;
  }

  public getEmployee() {
    return this.employee;
  }

  public getDepartment() {
    return this.department;
  }

  public getSubordinates() {
    return this.subordinates;
  }

  public addSubordinate(subordinate: EmployeeTreeNode) {
    if (this.subordinates === null)
      this.subordinates = []

    this.subordinates.push(subordinate);
  }
}

export default EmployeeTreeNode;