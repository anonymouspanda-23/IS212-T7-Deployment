import { FormData } from '../pages/wfh-application/types';

export const validateForm = (formData: FormData): string | null => {
  if (formData.wfhDates.length === 0) {
    return 'Please select at least one date.';
  }

  if (formData.reason.trim() === '') {
    return 'Please provide a reason for your WFH request.';
  }

  return null;
};