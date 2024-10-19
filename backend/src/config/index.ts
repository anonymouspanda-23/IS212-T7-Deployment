import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import CronJob from "@/services/CronJob";
import EmployeeService from "@/services/EmployeeService";
import LogService from "@/services/LogService";
import ReassignmentService from "@/services/ReassignmentService";
import RequestService from "@/services/RequestService";
import mongoose from "mongoose";

const startCronJob = async () => {
  const requestDb = new RequestDb();

  const employeeDb = new EmployeeDb();
  const employeeService = new EmployeeService(employeeDb);

  const logDb = new LogDb();
  const logService = new LogService(logDb);

  const reassignmentDb = new ReassignmentDb();
  const reassignmentService = new ReassignmentService(
    reassignmentDb,
    requestDb,
    employeeService,
    logService,
  );

  const requestService = new RequestService(
    logService,
    employeeService,
    requestDb,
    reassignmentService,
  );

  const job = new CronJob(requestService, reassignmentService);
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
