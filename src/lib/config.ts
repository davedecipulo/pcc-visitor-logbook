export const SCHOOL = {
  name: "Passi City College",
  short: "PCC",
  system: "Visitor Logbook",
  /** Logo file in /public. Set to null to show a placeholder instead. */
  logoSrc: "/pcc-logo.png" as string | null,
};

export const TIMEZONE = "Asia/Manila";

export const PURPOSES = [
  "Enrollment / Admission",
  "Inquiry",
  "Document Request",
  "Payment",
  "Meeting / Appointment",
  "Visit a Student",
  "Delivery",
  "Official Business",
  "Job Application",
  "Other",
] as const;

export const OFFICES = [
  "Registrar's Office",
  "Cashier / Accounting",
  "Admissions Office",
  "Office of the President",
  "Dean's Office",
  "Guidance Office",
  "Student Affairs (OSA)",
  "Library",
  "Faculty Room",
  "Human Resources",
  "Clinic",
  "Other",
] as const;

/** Visitors still inside after this many hours are highlighted for the guard. */
export const OVERSTAY_HOURS = 4;
