import { supabase } from "./supabase";

export type SheetColumnType = "TEXT" | "NUMBER" | "DATE";

export const COLUMN_TYPE_LABELS: Record<SheetColumnType, string> = {
  TEXT: "نص",
  NUMBER: "رقم",
  DATE: "تاريخ",
};

export interface Sheet {
  id: string;
  name: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SheetColumn {
  id: string;
  sheet_id: string;
  name: string;
  column_type: SheetColumnType;
  column_order: number;
}

export interface SheetRow {
  id: string;
  sheet_id: string;
  row_order: number;
}

export interface SheetCell {
  id: string;
  row_id: string;
  column_id: string;
  value: string | null;
}

// =====================================================
// Sheets
// =====================================================

export async function fetchSheets(): Promise<Sheet[]> {
  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function fetchSheetById(id: string): Promise<Sheet> {
  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function createSheet(params: {
  name: string;
  columns: { name: string; column_type: SheetColumnType }[];
  createdBy: string | null;
  createdByName: string;
}): Promise<string> {
  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .insert({
      name: params.name,
      created_by: params.createdBy,
      created_by_name: params.createdByName,
    })
    .select("id")
    .single();

  if (sheetError) throw sheetError;

  const columnsPayload = params.columns.map((col, index) => ({
    sheet_id: sheet.id,
    name: col.name,
    column_type: col.column_type,
    column_order: index,
  }));

  const { error: columnsError } = await supabase
    .from("sheet_columns")
    .insert(columnsPayload);

  if (columnsError) throw columnsError;

  return sheet.id;
}

export async function updateSheetName(id: string, name: string) {
  const { error } = await supabase
    .from("sheets")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSheet(id: string) {
  const { error } = await supabase.from("sheets").delete().eq("id", id);

  if (error) throw error;
}

// =====================================================
// Columns
// =====================================================

export async function fetchSheetColumns(
  sheetId: string
): Promise<SheetColumn[]> {
  const { data, error } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("column_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function addColumn(
  sheetId: string,
  name: string,
  columnType: SheetColumnType,
  order: number
) {
  const { error } = await supabase.from("sheet_columns").insert({
    sheet_id: sheetId,
    name,
    column_type: columnType,
    column_order: order,
  });

  if (error) throw error;
}

export async function deleteColumn(id: string) {
  const { error } = await supabase
    .from("sheet_columns")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =====================================================
// Rows
// =====================================================

export async function fetchSheetRows(sheetId: string): Promise<SheetRow[]> {
  const { data, error } = await supabase
    .from("sheet_rows")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("row_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function addRow(
  sheetId: string,
  order: number
): Promise<string> {
  const { data, error } = await supabase
    .from("sheet_rows")
    .insert({ sheet_id: sheetId, row_order: order })
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

export async function deleteRow(id: string) {
  const { error } = await supabase.from("sheet_rows").delete().eq("id", id);

  if (error) throw error;
}

// =====================================================
// Cells
// =====================================================

export async function fetchSheetCells(
  rowIds: string[]
): Promise<SheetCell[]> {
  if (rowIds.length === 0) return [];

  const { data, error } = await supabase
    .from("sheet_cells")
    .select("*")
    .in("row_id", rowIds);

  if (error) throw error;

  return data ?? [];
}

export async function upsertCell(
  rowId: string,
  columnId: string,
  value: string
) {
  const { error } = await supabase.from("sheet_cells").upsert(
    { row_id: rowId, column_id: columnId, value },
    { onConflict: "row_id,column_id" }
  );

  if (error) throw error;
}
// =====================================================
// Reports (اليوميات)
// =====================================================

export interface SheetReport {
  id: string;
  sheet_id: string;
  name: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface SheetReportColumn {
  id: string;
  report_id: string;
  column_id: string;
  level_order: number;
}

export async function fetchSheetReports(
  sheetId: string
): Promise<SheetReport[]> {
  const { data, error } = await supabase
    .from("sheet_reports")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function fetchReportColumns(
  reportId: string
): Promise<SheetReportColumn[]> {
  const { data, error } = await supabase
    .from("sheet_report_columns")
    .select("*")
    .eq("report_id", reportId)
    .order("level_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function createReport(params: {
  sheetId: string;
  name: string;
  columnIds: string[]; // بالترتيب اللي هيتحسب بيه التجميع
  createdBy: string | null;
  createdByName: string;
}): Promise<string> {
  const { data: report, error: reportError } = await supabase
    .from("sheet_reports")
    .insert({
      sheet_id: params.sheetId,
      name: params.name,
      created_by: params.createdBy,
      created_by_name: params.createdByName,
    })
    .select("id")
    .single();

  if (reportError) throw reportError;

  const payload = params.columnIds.map((columnId, index) => ({
    report_id: report.id,
    column_id: columnId,
    level_order: index,
  }));

  const { error: columnsError } = await supabase
    .from("sheet_report_columns")
    .insert(payload);

  if (columnsError) throw columnsError;

  return report.id;
}

export async function deleteReport(id: string) {
  const { error } = await supabase
    .from("sheet_reports")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =====================================================
// حساب التجميع الهرمي (Group By متعدد المستويات)
// =====================================================

export interface GroupNode {
  value: string;
  count: number;
  children: GroupNode[];
}

/**
 * بياخد بيانات الكشف كاملة (rows + cells) وقائمة أعمدة التجميع بالترتيب،
 * ويرجع شجرة تجميع هرمية: كل مستوى بيتفرع حسب قيم العمود اللي بعده.
 */
export function buildGroupTree(
  rows: { id: string }[],
  cellMap: Map<string, string>,
  columnIds: string[]
): GroupNode[] {
  function getValue(rowId: string, columnId: string): string {
    const raw = cellMap.get(`${rowId}:${columnId}`);
    const trimmed = (raw ?? "").trim();
    return trimmed || "(بدون قيمة)";
  }

  function groupLevel(
    rowIds: string[],
    levelIndex: number
  ): GroupNode[] {
    if (levelIndex >= columnIds.length) {
      return [];
    }

    const columnId = columnIds[levelIndex];
    const buckets = new Map<string, string[]>();

    rowIds.forEach((rowId) => {
      const value = getValue(rowId, columnId);
      const bucket = buckets.get(value) ?? [];
      bucket.push(rowId);
      buckets.set(value, bucket);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "ar"))
      .map(([value, ids]) => ({
        value,
        count: ids.length,
        children: groupLevel(ids, levelIndex + 1),
      }));
  }

  const allRowIds = rows.map((r) => r.id);
  return groupLevel(allRowIds, 0);
}