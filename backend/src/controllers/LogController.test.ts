import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import { errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";
import LogService from "@/services/LogService";
import { Context } from "koa";
import LogController from "./LogController";
import UtilsController from "./UtilsController";

jest.mock("@/services/LogService");
jest.mock("./UtilsController");

describe("LogController", () => {
  let logService: LogService;
  let logController: LogController;
  let ctx: Context;

  const employeeDb = new EmployeeDb();
  const employeeService = new EmployeeService(employeeDb);
  const logDb = new LogDb();

  const reassignmentDb = new ReassignmentDb();

  beforeEach(() => {
    logService = new LogService(
      logDb,
      employeeService,
      reassignmentDb,
    ) as jest.Mocked<LogService>;
    logController = new LogController(logService);
    ctx = {
      request: {
        header: {},
      },
      body: {},
    } as unknown as Context;
  });

  it("should throw an error if id is missing in headers", async () => {
    await logController.getAllLogs(ctx);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_HEADER,
    );
  });

  it("should return logs if found", async () => {
    const mockLogs = [
      { id: 1, message: "Log entry 1" },
      { id: 2, message: "Log entry 2" },
    ];
    ctx.request.header.id = "123";
    logService.getAllLogs = jest.fn().mockResolvedValue(mockLogs);

    await logController.getAllLogs(ctx);

    expect(ctx.body).toEqual(mockLogs);
    expect(logService.getAllLogs).toHaveBeenCalledWith(123);
  });

  it("should return an error message if logs not found", async () => {
    ctx.request.header.id = "123";
    logService.getAllLogs = jest.fn().mockResolvedValue(null);

    await logController.getAllLogs(ctx);

    expect(ctx.body).toEqual({ errMsg: errMsg.LOGS_NOT_FOUND });
    expect(logService.getAllLogs).toHaveBeenCalledWith(123);
  });
});
