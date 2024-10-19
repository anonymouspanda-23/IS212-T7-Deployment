
export type TimeOfDay = 'AM' | 'PM' | 'FULL';

export interface WFHDate {
  date: Date;
  timeOfDay: TimeOfDay;
}

export interface FormData {
  wfhDates: WFHDate[];
  reason: string;
}