import { calendarVar } from "@/helper/scheduleVar";
export const customCalendarConfig = {
    // Approved
    [calendarVar.HALFDAY]: {
      colorName: calendarVar.HALFDAY,
      lightColors: {
        main: '#ff9900',
        container: '#E5F9F4', // Light Mint
        onContainer: '#0A5C3B', // Dark Green text
      },
      darkColors: {
        main: '#ff9900',
        onContainer: '#34C759', // Soft Green text
        container: '#1A1D23', // Dark Background
      },
    },
    [calendarVar.FULLDAY]: {
      colorName: calendarVar.FULLDAY,
      lightColors: {
        main: '#9d4edd',
        container: '#E5F9F4', // Light Mint
        onContainer: '#0A5C3B', // Dark Green text
      },
      darkColors: {
        main: '#9d4edd',
        onContainer: '#34C759', // Soft Green text
        container: '#1A1D23', // Dark Background
      },
    },
    // Pending
    [calendarVar.PENDINGFULL]: {
      colorName: calendarVar.PENDINGFULL,
      lightColors: {
        main: '#9d4edd', // purple
        container: '#F2F2F2', // Light Gray
        onContainer: '#363636', // Dark Gray text
      },
      darkColors: {
        main: '#9d4edd', // purple
        onContainer: '#FFFFFF', // White text
        container: '#333333', // Dark Gray background
      },
    },
    [calendarVar.PENDINGHALF]: {
      colorName: calendarVar.PENDINGHALF,
      lightColors: {
        main: '#ff9900', // purple
        container: '#F2F2F2', // Light Gray
        onContainer: '#363636', // Dark Gray text
      },
      darkColors: {
        main: '#ff9900', // purple
        onContainer: '#FFFFFF', // White text
        container: '#333333', // Dark Gray background
      },
    },
}