import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { SCHOOL } from "@/lib/config";
import { formatDuration, formatPhone } from "@/lib/format";
import { applyFilters, parseFilters } from "@/lib/logs-query";
import { createSessionClient, getAdminUser } from "@/lib/supabase/server";
import type { Visitor } from "@/lib/types";

const MAX_ROWS = 10_000;
const MANILA_OFFSET_MS = 8 * 3_600_000; // UTC+8, no DST

/**
 * Excel dates have no time zone, so shift UTC to Manila wall-clock time
 * before writing; the cell then shows the same time the guard saw.
 */
const toExcelDate = (iso: string) => new Date(new Date(iso).getTime() + MANILA_OFFSET_MS);

/** Prevents spreadsheet formula injection from visitor-typed text. */
const safe = (v: string | null | undefined) => {
  const s = v ?? "";
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: "Log No.", key: "log_no", width: 9 },
  { header: "Full Name", key: "full_name", width: 26 },
  { header: "Contact Number", key: "contact", width: 16 },
  { header: "Address", key: "address", width: 32 },
  { header: "Purpose", key: "purpose", width: 22 },
  { header: "Purpose Details", key: "purpose_details", width: 30 },
  { header: "Office Visited", key: "office", width: 24 },
  { header: "Person Visited", key: "person", width: 20 },
  { header: "Student Name", key: "student", width: 22 },
  { header: "Course/Year/Section", key: "course", width: 18 },
  { header: "Time In", key: "time_in", width: 20 },
  { header: "Time Out", key: "time_out", width: 20 },
  { header: "Duration", key: "duration", width: 11 },
  { header: "Timed Out By", key: "timed_out_by", width: 13 },
];

const DATE_FMT = "mmm d, yyyy h:mm AM/PM";
const HEADER_ROW = 4;

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const f = parseFilters(request.nextUrl.searchParams);
  const supabase = await createSessionClient();
  const { data, error } = await applyFilters(supabase.from("visitors").select("*"), f)
    .order("time_in", { ascending: true })
    .limit(MAX_ROWS);

  if (error) {
    console.error("Excel export failed:", error);
    return new Response("Export failed", { status: 500 });
  }

  const rows = data as Visitor[];
  const now = Date.now();
  const rangeLabel = f.from === f.to ? f.from : `${f.from} to ${f.to}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = SCHOOL.name;
  wb.created = new Date();
  const ws = wb.addWorksheet("Visitor Log", {
    views: [{ state: "frozen", ySplit: HEADER_ROW }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.columns = COLUMNS.map(({ key, width }) => ({ key, width }));

  // Title block
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  ws.getCell(1, 1).value = `${SCHOOL.name} · Visitor Logbook`;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, COLUMNS.length);
  ws.getCell(2, 1).value =
    `${rangeLabel} · ${rows.length} record${rows.length === 1 ? "" : "s"}` +
    (f.purpose ? ` · Purpose: ${f.purpose}` : "") +
    (f.status !== "all" ? ` · ${f.status === "inside" ? "Still inside" : "Checked out"}` : "") +
    (rows.length === MAX_ROWS ? ` · Limited to the first ${MAX_ROWS} rows` : "");
  ws.getCell(2, 1).font = { color: { argb: "FF64748B" } };

  // Header row
  const header = ws.getRow(HEADER_ROW);
  header.values = COLUMNS.map((c) => c.header);
  header.height = 22;
  header.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C1D95" } };
    c.alignment = { vertical: "middle" };
  });

  // Data rows
  rows.forEach((v, i) => {
    const row = ws.getRow(HEADER_ROW + 1 + i);
    row.values = {
      log_no: v.log_no,
      full_name: safe(v.full_name),
      contact: formatPhone(v.contact_number), // text, so the leading 0 is kept
      address: safe(v.address),
      purpose: safe(v.purpose),
      purpose_details: safe(v.purpose_details),
      office: safe(v.office_to_visit),
      person: safe(v.person_to_visit),
      student: safe(v.student_name),
      course: safe(v.student_course_year),
      time_in: toExcelDate(v.time_in),
      time_out: v.time_out ? toExcelDate(v.time_out) : "Still inside",
      duration: formatDuration(v.time_in, v.time_out, now),
      timed_out_by: v.timed_out_by ?? "",
    };
    row.alignment = { vertical: "top", wrapText: true };
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } };
      });
    }
  });

  ws.getColumn("contact").numFmt = "@";
  ws.getColumn("time_in").numFmt = DATE_FMT;
  ws.getColumn("time_out").numFmt = DATE_FMT;
  ws.getColumn("log_no").alignment = { horizontal: "left", vertical: "top" };

  ws.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: HEADER_ROW + Math.max(rows.length, 1), column: COLUMNS.length },
  };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `pcc-visitors_${f.from}${f.from === f.to ? "" : `_to_${f.to}`}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
