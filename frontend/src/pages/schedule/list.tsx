import { useContext, useEffect, useRef, useState } from "react";

import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";
import axios from "axios";

// SCHEDULE-X imports
import { customCalendarConfig } from "@/config/calendarType";
import { IEvent, IResponseData } from "@/interfaces/schedule";
import {
  CalendarApp,
  createCalendar,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
  viewMonthGrid,
} from "@schedule-x/calendar";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import "@schedule-x/theme-default/dist/index.css";
import { ColorModeContext } from "../../contexts/color-mode";
import { calendarVar, RequestType } from "../../helper/scheduleVar";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const ScheduleList = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [calendarEvents, setCalendarEvents] = useState<IEvent[]>([]); // State for calendar events
  const [eventsLoaded, setEventsLoaded] = useState(false); // State for calendar events

  useEffect(() => {
    if (user?.staffId) {
      fetchScheduleData(user.staffId);
    }
  }, [user]);

  const fetchScheduleData = async (staffId: string) => {
    try {
      const responseData = await axios.get(
        `${backendUrl}/api/v1/getMySchedule`,
        {
          params: { myId: staffId },
          timeout: 300000,
        },
      );
      const eventArr: IResponseData[] = Array.isArray(responseData?.data)
        ? responseData.data
        : [];
      const formattedData: IEvent[] = eventArr.map((item) => {
        const formatDate = (date: Date, time?: string) =>
          `${date.toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })}${time ? ` ${time}` : ""}`;
        let start, end;
        const requestedDate = new Date(item.requestedDate);
        switch (item.requestType) {
          case RequestType.FULL:
            start = end = formatDate(requestedDate);
            break;

          case RequestType.PM:
            start = formatDate(requestedDate, "13:00"); // Hard set time for PM
            end = formatDate(requestedDate, "18:00");
            break;

          case RequestType.AM:
            start = formatDate(requestedDate, "08:00"); // Hard set time for AM
            end = formatDate(requestedDate, "12:00");
            break;

          default:
            start = end = formatDate(requestedDate);
            break;
        }
        let calendarColor;
        if (item.status == "PENDING") {
          calendarColor =
            item.requestType == RequestType.FULL
              ? calendarVar.PENDINGFULL
              : calendarVar.PENDINGHALF;
        } else {
          calendarColor =
            item.requestType == RequestType.FULL
              ? calendarVar.FULLDAY
              : calendarVar.HALFDAY;
        }
        return {
          id: item.requestId.toString(),
          title: `Work from Home (${item.requestType})`,
          description: `Request by ${item.staffName} to ${item.reason}`,
          start,
          end,
          calendarId: calendarColor,
        };
      });
      // Update calendar events
      setCalendarEvents(formattedData || []);
      setEventsLoaded(true);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  // Schedule-X const
  const { mode } = useContext(ColorModeContext);
  const calendarTheme = mode === "dark" ? "dark" : "light";
  const calendarRef = useRef<CalendarApp | null>(null);

  // Create the Calendar
  useEffect(() => {
    if (!calendarRef.current && eventsLoaded) {
      calendarRef.current = createCalendar({
        views: [
          createViewWeek(),
          createViewMonthGrid(),
          createViewMonthAgenda(),
        ],
        events: calendarEvents, // Initially empty
        isDark: calendarTheme === "dark", // Dynamically set the dark mode
        defaultView: viewMonthGrid.name,
        weekOptions: {
          gridHeight: 500,
          nDays: 5,
          timeAxisFormatOptions: { hour: "2-digit", minute: "2-digit" },
        },
        dayBoundaries: {
          start: "08:00",
          end: "18:00",
        },
        plugins: [createEventModalPlugin()],
        calendars: customCalendarConfig,
      });
      calendarRef.current.render(
        document.getElementById("calendar") as HTMLElement,
      );
    }
  }, [calendarEvents, eventsLoaded, calendarTheme]);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.setTheme(calendarTheme);
    }
  }, [calendarTheme]);

  return (
    <div>
      <div id="calendar" style={{ height: "650px", maxHeight: "90vh" }}></div>
    </div>
  );
};
