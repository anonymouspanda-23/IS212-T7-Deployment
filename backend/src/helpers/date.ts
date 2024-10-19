import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localeData from "dayjs/plugin/localeData";

dayjs.extend(weekOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localeData);

const localeObject = {
  name: "es",
  weekdays: "Domingo_Lunes ...".split("_"),
  weekStart: 1,
  months: "Enero_Febrero ... ".split("_"),
  formats: {
    LTS: "h:mm:ss A",
    LT: "h:mm A",
    L: "MM/DD/YYYY",
    LL: "MMMM D, YYYY",
    LLL: "MMMM D, YYYY h:mm A",
    LLLL: "dddd, MMMM D, YYYY h:mm A",
    l: "D/M/YYYY",
    ll: "D MMM, YYYY",
    lll: "D MMM, YYYY h:mm A",
    llll: "ddd, MMM D, YYYY h:mm A",
  },
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
};

dayjs.locale(localeObject);

function weekMap(dates: Date[]) {
  const weekMap: { [key: string]: number } = {};
  for (const date of dates) {
    const localizedDate = dayjs(date).tz("Asia/Singapore");
    const weekNumber = localizedDate.week();
    const year = localizedDate.year();
    const key = `${year}-${weekNumber}`;

    if (weekMap[key]) {
      weekMap[key]++;
    } else {
      weekMap[key] = 1;
    }
  }
  return weekMap;
}

function checkDate(date: Date, weekMap: any) {
  const localizedDate = dayjs(date).tz("Asia/Singapore");
  const weekNumber = localizedDate.week();
  const year = localizedDate.year();
  const key = `${year}-${weekNumber}`;

  if (weekMap[key] && weekMap[key] >= 2) {
    weekMap[key]++;
    return true;
  } else if (weekMap[key]) {
    weekMap[key]++;
  } else {
    weekMap[key] = 1;
  }
  return false;
}

function checkPastDate(date: Date) {
  let singaporeTime = dayjs().tz("Asia/Singapore");
  singaporeTime = singaporeTime.hour(0).minute(0).second(0).millisecond(0);
  const tomorrowInSingapore = singaporeTime.add(1, "day");
  let dateInput = dayjs(date).tz("Asia/Singapore");
  dateInput = dateInput.hour(0).minute(0).second(0).millisecond(0);
  if (
    dateInput.isBefore(tomorrowInSingapore) ||
    dateInput.isSame(tomorrowInSingapore, "day")
  ) {
    return true;
  }
  return false;
}

function checkPastWithdrawalDate(date: Date) {
  let singaporeTime = dayjs().tz("Asia/Singapore");
  singaporeTime = singaporeTime.hour(0).minute(0).second(0).millisecond(0);
  const tomorrowInSingapore = singaporeTime.add(1, "day");
  let dateInput = dayjs(date).tz("Asia/Singapore");
  dateInput = dateInput.hour(0).minute(0).second(0).millisecond(0);
  if (
    dateInput.isBefore(tomorrowInSingapore)
  ) {
    return true;
  }
  return false;
}

function checkValidWithdrawalDate(date: Date) {
  let singaporeTime = dayjs().tz("Asia/Singapore");
  singaporeTime = singaporeTime.hour(0).minute(0).second(0).millisecond(0);
  let dateInput = dayjs(date).tz("Asia/Singapore");
  dateInput = dateInput.hour(0).minute(0).second(0).millisecond(0);
  if (singaporeTime.isBefore(dateInput)) {
    return true;
  }
  return false;
}

function checkWeekend(date: Date) {
  let dateInput = dayjs(date).tz("Asia/Singapore");
  let dayOfWeek = dateInput.day();
  if (dayOfWeek == 0 || dayOfWeek == 6) {
    return true;
  }
  return false;
}

function checkLatestDate(date: Date, testDate: Date | null = null) {
  let singaporeTime = dayjs(testDate || new Date()).tz("Asia/Singapore");
  singaporeTime = singaporeTime.hour(0).minute(0).second(0).millisecond(0);
  let dateInput = dayjs(date).tz("Asia/Singapore");
  dateInput = dateInput.hour(0).minute(0).second(0).millisecond(0);
  let dayOfWeek = dateInput.day();
  if (dayOfWeek === 1 || dayOfWeek == 2) {
    const latestApplicationDate = dateInput.subtract(4, "day");
    if (singaporeTime.isAfter(latestApplicationDate)) {
      return true;
    }
  }
  return false;
}

export {
  weekMap,
  checkDate,
  checkPastDate,
  checkLatestDate,
  checkWeekend,
  checkPastWithdrawalDate,
  checkValidWithdrawalDate,
};
