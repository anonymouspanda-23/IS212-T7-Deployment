import EmployeeDb from "@/database/EmployeeDb";
import { errMsg } from "@/helpers";
import { IEmployee } from "@/models/Employee";
import bcrpyt from "bcrypt";

class EmployeeService {
  private employeeDb: EmployeeDb;

  constructor(employeeDb: EmployeeDb) {
    this.employeeDb = employeeDb;
  }

  public async getEmployee(staffId: number): Promise<IEmployee | null> {
    const employee = await this.employeeDb.getEmployee(staffId);
    return employee;
  }

  public async getEmployeeByEmail(staffEmail: string, inputPassword: string) {
    const result = await this.employeeDb.getEmployeeByEmail(staffEmail);
    if (!result) {
      return errMsg.USER_DOES_NOT_EXIST;
    }

    const { hashedPassword } = result;
    const isAuthenticated = await bcrpyt.compare(inputPassword, hashedPassword);
    if (!isAuthenticated) {
      return errMsg.WRONG_PASSWORD;
    }

    return await this.employeeDb.getEmployeeByEmail(staffEmail);
  }

  public async getDeptByManager(staffId: number) {
    return await this.employeeDb.getDeptByManager(staffId);
  }

  public async getAllDeptTeamCount() {
    return await this.employeeDb.getAllDeptTeamCount();
  }

  public async getRoleOneEmployees() {
    return await this.employeeDb.getRoleOneEmployees();
  }
}

export default EmployeeService;
