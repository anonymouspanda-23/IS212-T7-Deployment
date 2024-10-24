import Mailer from "@/config/mailer";
import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import WithdrawalDb from "@/database/WithdrawalDb";
import CronJob from "@/services/CronJob";
import EmployeeService from "@/services/EmployeeService";
import LogService from "@/services/LogService";
import NotificationService from "@/services/NotificationService";
import ReassignmentService from "@/services/ReassignmentService";
import RequestService from "@/services/RequestService";
import WithdrawalService from "@/services/WithdrawalService";
import mongoose from "mongoose";

const startCronJob = async () => {
  const requestDb = new RequestDb();
  const employeeDb = new EmployeeDb();
  const employeeService = new EmployeeService(employeeDb);
  const mailer = Mailer.getInstance();
  const notificationService = new NotificationService(employeeService, mailer);
  const logDb = new LogDb();
  const logService = new LogService(logDb, employeeService);

  const reassignmentDb = new ReassignmentDb();
  const reassignmentService = new ReassignmentService(
    reassignmentDb,
    requestDb,
    employeeService,
    logService,
    notificationService,
  );

  const requestService = new RequestService(
    logService,
    employeeService,
    notificationService,
    requestDb,
    reassignmentService,
  );

  const withdrawalDb = new WithdrawalDb();
  const withdrawalService = new WithdrawalService(
    logService,
    withdrawalDb,
    requestService,
    reassignmentService,
    employeeService,
  );

  const job = new CronJob(
    requestService,
    reassignmentService,
    withdrawalService,
  );
  job.execute();
};

const initDB = () => {
  mongoose.connect(String(process.env.CONNECTION_STRING));
  mongoose.connection.once("open", () => {
    console.log("💿 Connected to MongoDB 💿");
  });

  mongoose.connection.on("error", console.error);
};

export { initDB, startCronJob };
