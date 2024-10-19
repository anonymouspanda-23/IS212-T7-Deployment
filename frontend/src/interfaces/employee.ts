export interface EmployeeJWT {
    staffId: string,
    role: number,
    name: string;
    dept: string;
    email: string;
    position: string;
    reportingManager: number;
    reportingManagerName: string;
    tempReportingManager: string | null;
    tempReportingManagerName: number | null;
}