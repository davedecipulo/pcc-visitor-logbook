import type { Metadata } from "next";
import { TimeInForm } from "./TimeInForm";

export const metadata: Metadata = { title: "Time In · PCC Visitor Logbook" };

export default function TimeInPage() {
  return <TimeInForm />;
}
