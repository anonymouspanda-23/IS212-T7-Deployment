import dayjs from "dayjs";

export const dayWeekAfter = (day: number) => {
  return dayjs()
    .tz("Asia/Singapore")
    .day(day)
    .add(1, "week")
    .format("YYYY-MM-DD");
};
