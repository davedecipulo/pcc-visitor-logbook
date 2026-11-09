import type { Metadata } from "next";
import { TimeOutFlow } from "./TimeOutFlow";

export const metadata: Metadata = { title: "Time Out · PCC Visitor Logbook" };

export default function TimeOutPage() {
  return <TimeOutFlow />;
}
