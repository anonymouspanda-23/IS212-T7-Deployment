export enum ActionColor {
  APPLY = "blue", // Represents a positive action, like applying
  APPROVE = "green", // Indicates approval, which is a positive outcome
  RETRIEVE = "geekblue", // Neutral color indicating retrieval (using geekblue for clarity)
  REJECT = "red", // Clear indication of rejection
  CANCEL = "grey", // Neutral or passive action indicating cancellation
  REVOKE = "orange", // Similar to cancel, can use a warning color
  REASSIGN = "cyan", // Neutral color for reassigning tasks
  EXPIRE = "gold", // Represents something that is time-sensitive
  SET_INACTIVE = "red", // Indicates a negative action of setting something inactive
  SET_ACTIVE = "green", // Indicates a positive action of activating
}
export enum Action {
  APPLY = "APPLY",
  APPROVE = "APPROVE",
  RETRIEVE = "RETRIEVE",
  REJECT = "REJECT",
  CANCEL = "CANCEL",
  REVOKE = "REVOKE",
  REASSIGN = "REASSIGN",
  EXPIRE = "EXPIRE",
  SET_INACTIVE = "SET_INACTIVE",
  SET_ACTIVE = "SET_ACTIVE",
}

export enum Status {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  WITHDRAWN = "WITHDRAWN",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}
export default { ActionColor, Action, Status };
