import { Dept } from "@/helpers";

const middlewareMockData = {
  [Dept.CEO]: {
    staffId: 130002,
    staffFName: "Jack",
    staffLName: "Sim",
    dept: "CEO",
    position: "MD",
    country: "Singapore",
    email: "jack.sim@allinone.com.sg",
    reportingManager: 130002,
    role: 1,
    reportingManagerName: "Jack Sim",
    tempReportingManager: null,
    tempReportingManagerName: null,
  },
  [`${Dept.SALES}_Same_Team`]: {
    staffId: 140004,
    staffFName: "Mary",
    staffLName: "Teo",
    dept: "Sales",
    position: "Account Manager",
    country: "Singapore",
    email: "Mary.Teo@allinone.com.sg",
    reportingManager: 140894,
    role: 2,
    reportingManagerName: "Rahim Khalid",
    tempReportingManager: null,
    tempReportingManagerName: null,
  },
  [`${Dept.SALES}_Different_Team`]: {
    staffId: 140880,
    staffFName: "Heng",
    staffLName: "Chan",
    dept: "Sales",
    position: "Account Manager",
    country: "Singapore",
    email: "Heng.Chan@allinone.com.sg",
    reportingManager: 140008,
    role: 2,
    reportingManagerName: "Jaclyn Lee",
    tempReportingManager: null,
    tempReportingManagerName: null,
  },
  [Dept.ENGINEERING]: {
    staffId: 150115,
    staffFName: "Jaclyn",
    staffLName: "Poh",
    dept: "Engineering",
    position: "Junior Engineers",
    country: "Singapore",
    email: "Jaclyn.Poh@allinone.com.sg",
    reportingManager: 151408,
    role: 2,
    reportingManagerName: "Philip Lee",
    tempReportingManager: null,
    tempReportingManagerName: null,
  },
  [`${Dept.SALES}_Manager`]: {
    staffId: 140894,
    staffFName: "Rahim",
    staffLName: "Khalid",
    dept: "Sales",
    position: "Sales Manager",
    country: "Singapore",
    email: "Rahim.Khalid@allinone.com.sg",
    reportingManager: 140001,
    role: 3,
    reportingManagerName: "Derek Tan",
    tempReportingManager: null,
    tempReportingManagerName: null,
  },
};

export { middlewareMockData };
