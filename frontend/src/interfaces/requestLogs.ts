export interface ILogEntry {
    performedBy: number;
    staffName: string;
    dept: string;
    position: string;
    requestId: number | null;
    requestType: string;
    action: string;
    reason: string | null;
    createdAt: string;
    logId: number;
}

// Defines the structure for department's positions and their logs
export interface IPositionLogs {
    [position: string]: ILogEntry[];
}

// Defines the structure for departments and their positions
export interface IDepartmentLogs {
    [department: string]: IPositionLogs;
}