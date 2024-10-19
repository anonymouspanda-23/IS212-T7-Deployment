import cron from "node-cron";
import ReassignmentService from "./ReassignmentService";
import RequestService from "./RequestService";

class CronJob {
  private requestService: RequestService;
  private reassignmentService: ReassignmentService;

  constructor(
    requestService: RequestService,
    reassignmentService: ReassignmentService,
  ) {
    this.requestService = requestService;
    this.reassignmentService = reassignmentService;
  }

  public execute() {
    // To run at 00:00 AM daily
    cron.schedule("0 0 * * *", () => {
      this.requestService.updateRequestStatusToExpired();
      this.reassignmentService.setActiveReassignmentPeriod();
      this.reassignmentService.setInactiveReassignmentPeriod();
    });
  }
}

export default CronJob;
