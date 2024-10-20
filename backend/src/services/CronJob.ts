import cron from "node-cron";
import ReassignmentService from "./ReassignmentService";
import RequestService from "./RequestService";
import WithdrawalService from "./WithdrawalService";

class CronJob {
  private requestService: RequestService;
  private reassignmentService: ReassignmentService;
  private withdrawalService: WithdrawalService;

  constructor(
    requestService: RequestService,
    reassignmentService: ReassignmentService,
    withdrawalService: WithdrawalService,
  ) {
    this.requestService = requestService;
    this.reassignmentService = reassignmentService;
    this.withdrawalService = withdrawalService;
  }

  public execute() {
    // To run at 00:00 AM daily
    cron.schedule("0 0 * * *", () => {
      this.requestService.updateRequestStatusToExpired();
      this.withdrawalService.updateWithdrawalStatusToExpired();
      this.reassignmentService.setActiveReassignmentPeriod();
      this.reassignmentService.setInactiveReassignmentPeriod();
    });
  }
}

export default CronJob;
