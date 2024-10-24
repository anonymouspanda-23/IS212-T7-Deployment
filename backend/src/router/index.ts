import EmployeeController from "@/controllers/EmployeeController";
import LogController from "@/controllers/LogController";
import ReassignmentController from "@/controllers/ReassignmentController";
import RequestController from "@/controllers/RequestController";
import WithdrawalController from "@/controllers/WithdrawalController";
import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import WithdrawalDb from "@/database/WithdrawalDb";
import { AccessControl } from "@/helpers";
import { checkUserRolePermission } from "@/middleware/checkUserRolePermission";
import EmployeeService from "@/services/EmployeeService";
import LogService from "@/services/LogService";
import ReassignmentService from "@/services/ReassignmentService";
import RequestService from "@/services/RequestService";
import WithdrawalService from "@/services/WithdrawalService";
import swaggerSpec from "@/swagger";
import Router from "koa-router";
import { koaSwagger } from "koa2-swagger-ui";
import Mailer from "@/config/mailer";
import NotificationService from "@/services/NotificationService";

/**
 * Databases
 */
const requestDb = new RequestDb();
const employeeDb = new EmployeeDb();
const reassignmentDb = new ReassignmentDb();
const logDb = new LogDb();
const withdrawalDb = new WithdrawalDb();

/**
 * External Services
 */
const mailer = Mailer.getInstance();

/**
 * Services
 */
const employeeService = new EmployeeService(employeeDb);
const logService = new LogService(logDb, employeeService);
const notificationService = new NotificationService(employeeService, mailer);
const reassignmentService = new ReassignmentService(
  reassignmentDb,
  requestDb,
  employeeService,
  logService,
);
const requestService = new RequestService(
  logService,
  employeeService,
  notificationService,
  requestDb,
  reassignmentService,
);
const withdrawalService = new WithdrawalService(
  logService,
  withdrawalDb,
  requestService,
  reassignmentService,
  employeeService,
);

/**
 * Controllers
 */
const requestController = new RequestController(requestService);
const employeeController = new EmployeeController(employeeService);
const reassignmentController = new ReassignmentController(reassignmentService);
const withdrawalController = new WithdrawalController(withdrawalService);
const logController = new LogController(logService);

const router = new Router();

router.prefix("/api/v1");
router.get("/swagger.json", (ctx) => {
  ctx.body = swaggerSpec;
});

router.get(
  "/docs",
  koaSwagger({
    swaggerOptions: {
      url: `${process.env.DOMAIN}/api/v1/swagger.json`,
    },
  }),
);

router.get("/", async (ctx: any) => {
  ctx.body = `Server is Running! 💨`;
});

/**
 * @openapi
 * /api/v1/login:
 *   post:
 *     description: Login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffEmail:
 *                 type: string
 *                 description: The email of the employee
 *               staffPassword:
 *                 type: string
 *                 description: The password of the employee
 *             required:
 *               - staffEmail
 *               - staffPassword
 *     responses:
 *       200:
 *         description: Returns an employee object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staffId:
 *                   type: number
 *                   description: The employee's ID
 *                 role:
 *                   type: string
 *                   description: The employee's role
 *       400:
 *         description: Invalid request or missing parameters
 */
router.post("/login", (ctx) => employeeController.getEmployeeByEmail(ctx));

/**
 * @openapi
 * /api/v1/cancelPendingRequests:
 *   post:
 *     description: Cancel user's own pending requests
 *     tags: [Pending Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: number
 *                 description: The user's own staffId
 *               requestId:
 *                 type: string
 *                 description: RequestId to be cancelled
 *             required:
 *               - staffId
 *               - requestId
 */
router.post("/cancelPendingRequests", (ctx) =>
  requestController.cancelPendingRequests(ctx),
);

/**
 * @openapi
 * /api/v1/getAllSubordinatesRequests:
 *   get:
 *     description: Get pending request from direct subordinates
 *     tags: [All Subordinates Requests]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns all subordinates requests from direct subordinates
 */
router.get(
  "/getAllSubordinatesRequests",
  checkUserRolePermission(AccessControl.VIEW_PENDING_REQUEST),
  (ctx) => requestController.getAllSubordinatesRequests(ctx),
);

/**
 * @openapi
 * /api/v1/getOwnPendingRequests?myId={INSERT ID HERE}:
 *   get:
 *     description: Get own pending request
 *     tags: [Pending Requests]
 *     parameters:
 *       - in: query
 *         name: myId
 *         schema:
 *           type: number
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns own pending requests
 */
router.get("/getOwnPendingRequests", (ctx) =>
  requestController.getOwnPendingRequests(ctx),
);

/**
 * @openapi
 * /api/v1/getEmployee?staffId={INSERT ID HERE}:
 *   get:
 *     description: Get employee data
 *     tags: [Employee]
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: number
 *         required: true
 *         description: The Id of the employee to retrieve
 *     responses:
 *       200:
 *         description: Returns an employee object
 */
router.get("/getEmployee", (ctx) => employeeController.getEmployee(ctx));

/**
 * @openapi
 * /api/v1/getMySchedule?myId={INSERT ID HERE}:
 *   get:
 *     description: Get your own schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: myId
 *         schema:
 *           type: number
 *         required: true
 *         description: Retrieve lists of your schedule regardless of status
 *     responses:
 *       200:
 *         description: Returns a request object
 */
router.get("/getMySchedule", (ctx) => requestController.getMySchedule(ctx));

/**
 * @openapi
 * /api/v1/getSchedule:
 *   get:
 *     description: Get schedule depending on your role
 *     tags: [Schedule]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns a request object
 */
router.get("/getSchedule", (ctx) => requestController.getSchedule(ctx));

// /**
//  * @openapi
//  * /api/v1/getDeptScheduleByStaffId?staffId={INSERT STAFF ID HERE}:
//  *   get:
//  *     description: Get schedule for departments under current manager/director.
//  *     tags: [Schedule]
//  *     parameters:
//  *       - in: query
//  *         name: staffId
//  *         schema:
//  *           type: number
//  *         required: true
//  *         description: Retrieve list of departments under given staffId.
//  *     responses:
//  *       200:
//  *         description: Returns a request object
//  */
// router.get(
//   "/getDeptByManager",
//   checkUserRolePermission(AccessControl.VIEW_OVERALL_SCHEDULE),
//   (ctx) => employeeController.getDeptByManager(ctx),
// );

/**
 * @openapi
 * /api/v1/postRequest:
 *   post:
 *     description: Post Request data (Submit WFH application form)
 *     tags: [Request]
 *     parameters:
 *       - in: WFH Application Details
 *     responses:
 *       200:
 *         description: Returns an success, error, note object
 */
router.post("/postRequest", async (ctx) => {
  await requestController.postRequest(ctx);
});

/**
 * @openapi
 * /api/v1/approveRequest:
 *   post:
 *     description: approve subordinates' pending requests
 *     tags: [Pending Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: number
 *                 description: Manager's own staffId
 *               requestId:
 *                 type: string
 *                 description: RequestId to be approved
 *             required:
 *               - performedBy
 *               - requestId
 */
router.post("/approveRequest", (ctx) => requestController.approveRequest(ctx));

/**
 * @openapi
 * /api/v1/rejectRequest:
 *   post:
 *     description: reject subordinates' pending requests
 *     tags: [Pending Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: number
 *                 description: Manager's own staffId
 *               requestId:
 *                 type: string
 *                 description: RequestId to be rejected
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *             required:
 *               - performedBy
 *               - requestId
 *               - reason
 */
router.post("/rejectRequest", (ctx) => requestController.rejectRequest(ctx));

/**
 * @openapi
 * /api/v1/revokeRequest:
 *   post:
 *     description: revoke subordinates' approved requests
 *     tags: [Approved Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: number
 *                 description: Manager's own staffId
 *               requestId:
 *                 type: string
 *                 description: RequestId to be revoked
 *               reason:
 *                 type: string
 *                 description: Reason for revocation
 *             required:
 *               - performedBy
 *               - requestId
 *               - reason
 */
router.post("/revokeRequest", (ctx) => requestController.revokeRequest(ctx));

/**
 * @openapi
 * /api/v1/withdrawRequest:
 *   post:
 *     description: withdraw my own approved request
 *     tags: [Withdrawal Request]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: number
 *                 description: requestId of the request I want to withdraw
 *             required:
 *               - requestId
 */
router.post("/withdrawRequest", (ctx) =>
  withdrawalController.withdrawRequest(ctx),
);

/**
 * @openapi
 * /api/v1/getRoleOneOrThreeEmployees:
 *   get:
 *     description: Get role 1 or role 3 employees
 *     tags: [Employee]
 *     responses:
 *       200:
 *         description: Returns an array of role 1 or role 3 employees object
 */
router.get("/getRoleOneOrThreeEmployees", (ctx) =>
  employeeController.getRoleOneOrThreeEmployees(ctx),
);

/**
 * @openapi
 * /api/v1/requestReassignment:
 *   post:
 *     description: Initiate reassignment to another manager
 *     tags: [Reassignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: number
 *                 description: Your staffId
 *               startDate:
 *                 type: string
 *                 description: Your leave start date
 *               endDate:
 *                 type: string
 *                 description: Your leave end date
 *               tempReportingManagerId:
 *                 type: number
 *                 description: New manager staffId
 *             required:
 *               - staffId
 *               - startDate
 *               - endDate
 *               - tempReportingManagerId
 */
router.post("/requestReassignment", (ctx) =>
  reassignmentController.insertReassignmentRequest(ctx),
);

/**
 * @openapi
 * /api/v1/getReassignmentStatus:
 *   get:
 *     description: Get all reassignment status
 *     tags: [Reassignment]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns all reassignment status
 */
router.get("/getReassignmentStatus", (ctx) =>
  reassignmentController.getReassignmentStatus(ctx),
);

/**
 * @openapi

 * /api/v1/getIncomingReassignmentRequests:
 *   get:
 *     description: Get incoming reassignment requests
 *     tags: [Reassignment]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns incoming reassignment requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/getIncomingReassignmentRequests", (ctx) =>
  reassignmentController.getIncomingReassignmentRequests(ctx),
);

/**
 * @openapi
 * /api/v1/handleReassignmentRequest:
 *   post:
 *     description: Approve or Reject Reassignment Request
 *     tags: [Reassignment]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reassignmentId:
 *                 type: number
 *                 description: ID of the reassignment request
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to take on the request
 *     responses:
 *       200:
 *         description: Request handled successfully, updates status to approved/rejected
 */
router.post("/handleReassignmentRequest", (ctx) =>
  reassignmentController.handleReassignmentRequest(ctx),
);

/**
 * @openapi
 * /api/v1/getSubordinateRequestsForTempManager:
 *   get:
 *     description: Get subordinate requests of original manager for temporary manager
 *     tags: [Reassignment]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns subordinate requests for temporary manager
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: No active reassignment found
 */
router.get("/getSubordinateRequestsForTempManager", (ctx) =>
  reassignmentController.getSubordinateRequestsForTempManager(ctx),
);

/**
 * @openapi
 * /api/v1/getAllLogs:
 *   get:
 *     description: Get all logs
 *     tags: [Logs]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns all logs
 */
router.get("/getAllLogs", (ctx) => logController.getAllLogs(ctx));

/**
 * @openapi
 * /api/v1/getOwnWithdrawalRequests?staffId={INSERT ID HERE}:
 *   get:
 *     description: Get own withdrawal requests
 *     tags: [Own Withdrawal Requests]
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: number
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns own withdrawal requests
 */
router.get("/getOwnWithdrawalRequests", (ctx) =>
  withdrawalController.getOwnWithdrawalRequests(ctx),
);

/**
 * @openapi
 * /api/v1/getSubordinatesWithdrawalRequests:
 *   get:
 *     description: Get withdrawal request from direct and temp subordinates
 *     tags: [All Subordinates' Withdrawal Requests]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User's staffId
 *     responses:
 *       200:
 *         description: Returns all subordinates' withdrawal requests from direct and temp subordinates
 */
router.get(
  "/getSubordinatesWithdrawalRequests",
  checkUserRolePermission(AccessControl.VIEW_SUB_WITHDRAWAL_REQUEST),
  (ctx) => withdrawalController.getSubordinatesWithdrawalRequests(ctx),
);

/**
 * @openapi
 * /api/v1/approveWithdrawalRequest:
 *   post:
 *     description: Approve subordinate's withdrawal request
 *     tags: [Withdrawal Request]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: number
 *                 description: Manager's own staffId
 *               withdrawalId:
 *                 type: number
 *                 description: withdrawalId to be approved
 *             required:
 *               - performedBy
 *               - withdrawalId
 */
router.post("/approveWithdrawalRequest", (ctx) =>
  withdrawalController.approveWithdrawalRequest(ctx),
);

/**
 * @openapi
 * /api/v1/rejectWithdrawalRequest:
 *   post:
 *     description: Reject subordinate's withdrawal request
 *     tags: [Withdrawal Request]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: number
 *                 description: Manager's own staffId
 *               withdrawalId:
 *                 type: number
 *                 description: withdrawalId to be approved
 *               reason:
 *                 type: number
 *                 description: reason for rejection
 *             required:
 *               - performedBy
 *               - withdrawalId
 *               - reason
 */
router.post("/rejectWithdrawalRequest", (ctx) =>
  withdrawalController.rejectWithdrawalRequest(ctx),
);

export default router;
