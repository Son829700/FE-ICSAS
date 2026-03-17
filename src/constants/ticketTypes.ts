// src/constants/ticketTypes.ts

export const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE1: "Dashboard Access Request",
  TYPE2: "User Account Management",
  TYPE3: "Dashboard Development Request",
};

export const TICKET_TYPE_OPTIONS = [
  { value: "TYPE1", label: "Dashboard Access Request" },
  { value: "TYPE2", label: "User Account Management" },
  { value: "TYPE3", label: "Dashboard Development Request" },
];