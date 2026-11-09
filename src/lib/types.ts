export type Visitor = {
  id: string;
  log_no: number;
  full_name: string;
  contact_number: string;
  address: string;
  purpose: string;
  purpose_details: string | null;
  office_to_visit: string;
  person_to_visit: string | null;
  student_name: string | null;
  student_course_year: string | null;
  time_in: string;
  time_out: string | null;
  timed_out_by: "visitor" | "admin" | null;
};
