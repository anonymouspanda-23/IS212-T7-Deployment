import {
  weekMap,
  checkDate,
  checkWeekend,
  checkLatestDate,
  checkPastDate,
} from "./date";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);

describe("weekMap", () => {
  it("should correctly map dates to their respective week numbers (3 days of same week)", () => {
    const dates = [
      new Date("2024-09-19"),
      new Date("2024-09-20"),
      new Date("2024-09-21"),
    ];
    const result = weekMap(dates);
    expect(result).toStrictEqual({ "2024-38": 3 });
  });
});

describe("weekMap", () => {
  it("should correctly map dates to their respective week numbers (2 days from 2 different weeks)", () => {
    const dates = [new Date("2024-09-19"), new Date("2024-09-12")];
    const result = weekMap(dates);
    expect(result).toStrictEqual({ "2024-37": 1, "2024-38": 1 });
  });
});

describe("weekMap", () => {
  it("should correctly map dates to their respective week numbers (Monday and Sunday should be within same week)", () => {
    const dates = [new Date("2024-09-16"), new Date("2024-09-22")];
    const result = weekMap(dates);
    expect(result).toStrictEqual({ "2024-38": 2 });
  });
});

describe("checkDate", () => {
  it("should return true if there are already 2 or more requests in the same week", () => {
    const dates = [new Date("2024-09-19"), new Date("2024-09-20")];
    const weekMapping = weekMap(dates);
    expect(weekMapping).toStrictEqual({ "2024-38": 2 });
    const newDate = new Date("2024-09-21");
    const result = checkDate(newDate, weekMapping);
    expect(result).toBe(true);
  });

  it("should return false if there are less than 2 requests in the same week", () => {
    const dates = [new Date("2024-09-19")];
    const weekMapping = weekMap(dates);
    expect(weekMapping).toStrictEqual({ "2024-38": 1 });
    const newDate = new Date("2024-09-20");
    const result = checkDate(newDate, weekMapping);
    expect(result).toBe(false);
  });
});

describe("checkWeekend", () => {
  it("should return true it is a weekend", () => {
    const dates = new Date("2024-10-12");
    const checkwkend = checkWeekend(dates);
    expect(checkwkend).toBe(true);
  });

  it("should return false if it is a weekday", () => {
    const dates = new Date("2024-10-10");
    const checkwkend = checkWeekend(dates);
    expect(checkwkend).toBe(false);
  });
});

describe("checkPastDate", () => {
  it("should return true it is a past date", () => {
    const dates = new Date("2022-10-12");
    const checkwkend = checkPastDate(dates);
    expect(checkwkend).toBe(true);
  });

  it("should return true if it is not 24 hrs ahead of application", () => {
    const today = new Date();
    const checkToday = checkPastDate(today);
    expect(checkToday).toBe(true);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const checkTomorrow = checkPastDate(tomorrow);
    expect(checkTomorrow).toBe(true);
  });

  it("should return false if it is a future date", () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 2);
    const checkFuture = checkPastDate(future);
    expect(checkFuture).toBe(false);
  });
});

describe("checkLatestDate", () => {
  it("should return true if it is not 24 business hours before", () => {
    const monday = dayjs().tz("Asia/Singapore").day(1).add(1, "week").toDate();
    const testFriday = dayjs(monday).subtract(3, "day").toDate();
    expect(checkLatestDate(monday, testFriday)).toBe(true);
    const tuesday = dayjs().tz("Asia/Singapore").day(2).add(1, "week").toDate();
    const testMonday = dayjs(tuesday).subtract(1, "day").toDate();
    expect(checkLatestDate(monday, testMonday)).toBe(true);
  });

  it("should return false if it is 24 business hours before", () => {
    const monday = dayjs().tz("Asia/Singapore").day(1).add(1, "week").toDate();
    const testThursday = dayjs(monday).subtract(4, "day").toDate();
    expect(checkLatestDate(monday, testThursday)).toBe(false);
    const tuesday = dayjs().tz("Asia/Singapore").day(2).add(1, "week").toDate();
    const testFriday = dayjs(tuesday).subtract(4, "day").toDate();
    expect(checkLatestDate(tuesday, testFriday)).toBe(false);
  });
});

