import { supabase } from "./supabase";
export interface RoleOption {
  id: string;
  name: string;
}

export async function fetchAllRoleOptions(): Promise<RoleOption[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchSheetShareRoleIds(sheetId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("sheet_shares")
    .select("role_id")
    .eq("sheet_id", sheetId);

  if (error) throw error;

  return (data ?? []).map((r) => r.role_id as string);
}
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
  sharedRoleIds?: string[];
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

  if (params.sharedRoleIds && params.sharedRoleIds.length > 0) {
    const { error: sharesError } = await supabase.from("sheet_shares").insert(
      params.sharedRoleIds.map((roleId) => ({
        sheet_id: sheet.id,
        role_id: roleId,
      }))
    );

    if (sharesError) throw sharesError;
  }

  await addSheetLog(sheet.id, `${params.createdByName} أنشأ الكشف`);

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
export async function duplicateSheet(params: {
  sheetId: string;
  createdBy: string | null;
  createdByName: string;
}): Promise<string> {
  const original = await fetchSheetById(params.sheetId);

  // 1) حساب رقم النسخة التالي بناءً على الأسماء الموجودة
  const { data: existing, error: existingError } = await supabase
    .from("sheets")
    .select("name")
    .ilike("name", `${original.name} - نسخة رقم%`);

  if (existingError) throw existingError;

  let maxNumber = 0;
  (existing ?? []).forEach((s) => {
    const match = s.name.match(/نسخة رقم\s*(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  const newName = `${original.name} - نسخة رقم${maxNumber + 1}`;

  // 2) إنشاء الكشف الجديد
  const { data: newSheet, error: newSheetError } = await supabase
    .from("sheets")
    .insert({
      name: newName,
      created_by: params.createdBy,
      created_by_name: params.createdByName,
    })
    .select("id")
    .single();

  if (newSheetError) throw newSheetError;
  const newSheetId: string = newSheet.id;

  // 3) نسخ الأعمدة
  const originalColumns = await fetchSheetColumns(params.sheetId);
  const columnIdMap = new Map<string, string>();

  if (originalColumns.length > 0) {
    const columnsPayload = originalColumns.map((col) => ({
      sheet_id: newSheetId,
      name: col.name,
      column_type: col.column_type,
      column_order: col.column_order,
    }));

    const { data: insertedColumns, error: columnsError } = await supabase
      .from("sheet_columns")
      .insert(columnsPayload)
      .select("id, name, column_order");

    if (columnsError) throw columnsError;

    originalColumns.forEach((oldCol) => {
      const newCol = insertedColumns?.find(
        (c) => c.column_order === oldCol.column_order && c.name === oldCol.name
      );
      if (newCol) columnIdMap.set(oldCol.id, newCol.id);
    });
  }

  // 4) نسخ الصفوف
  const originalRows = await fetchSheetRows(params.sheetId);
  const rowIdMap = new Map<string, string>();

  if (originalRows.length > 0) {
    const rowsPayload = originalRows.map((row) => ({
      sheet_id: newSheetId,
      row_order: row.row_order,
    }));

    const { data: insertedRows, error: rowsError } = await supabase
      .from("sheet_rows")
      .insert(rowsPayload)
      .select("id, row_order");

    if (rowsError) throw rowsError;

    originalRows.forEach((oldRow) => {
      const newRow = insertedRows?.find((r) => r.row_order === oldRow.row_order);
      if (newRow) rowIdMap.set(oldRow.id, newRow.id);
    });

    // 5) نسخ الخلايا (القيم)
    const originalCells = await fetchSheetCells(originalRows.map((r) => r.id));

    if (originalCells.length > 0) {
      const cellsPayload = originalCells
        .map((cell) => {
          const newRowId = rowIdMap.get(cell.row_id);
          const newColumnId = columnIdMap.get(cell.column_id);
          if (!newRowId || !newColumnId) return null;
          return {
            row_id: newRowId,
            column_id: newColumnId,
            value: cell.value,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      if (cellsPayload.length > 0) {
        const { error: cellsError } = await supabase
          .from("sheet_cells")
          .insert(cellsPayload);

        if (cellsError) throw cellsError;
      }
    }
  }

  // 6) نسخ اليوميات (reports) وأعمدة التجميع الخاصة بها
  const originalReports = await fetchSheetReports(params.sheetId);

  for (const report of originalReports) {
    const { data: newReport, error: newReportError } = await supabase
      .from("sheet_reports")
      .insert({
        sheet_id: newSheetId,
        name: report.name,
        created_by: params.createdBy,
        created_by_name: params.createdByName,
      })
      .select("id")
      .single();

    if (newReportError) throw newReportError;

    const originalReportColumns = await fetchReportColumns(report.id);

    if (originalReportColumns.length > 0) {
      const reportColumnsPayload = originalReportColumns
        .map((rc) => {
          const newColumnId = columnIdMap.get(rc.column_id);
          if (!newColumnId) return null;
          return {
            report_id: newReport.id,
            column_id: newColumnId,
            level_order: rc.level_order,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      if (reportColumnsPayload.length > 0) {
        const { error: reportColumnsError } = await supabase
          .from("sheet_report_columns")
          .insert(reportColumnsPayload);

        if (reportColumnsError) throw reportColumnsError;
      }
    }
  }

  // 7) تسجيل عملية النسخ في سجل الكشف الجديد
  await addSheetLog(
    newSheetId,
    `${params.createdByName} أنشأ هذا الكشف كنسخة من "${original.name}"`
  );

  return newSheetId;
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

// =====================================================
// تجميع Pivot Table (جدول متقاطع)
// =====================================================

export interface PivotTable {
  rowValues: string[];
  headerLevels: string[][];
  leafCombos: string[][];
  matrix: number[][];
  rowTotals: number[];
  columnTotals: number[];
  grandTotal: number;
}

export function buildPivotTable(
  rows: { id: string }[],
  cellMap: Map<string, string>,
  columnIds: string[]
): PivotTable {
  function getValue(rowId: string, columnId: string): string {
    const raw = cellMap.get(`${rowId}:${columnId}`);
    const trimmed = (raw ?? "").trim();
    return trimmed || "(بدون قيمة)";
  }

  const rowColumnId = columnIds[0];
  const headerColumnIds = columnIds.slice(1);
  const allRowIds = rows.map((r) => r.id);

  const rowValuesSet = new Set<string>();
  allRowIds.forEach((id) => rowValuesSet.add(getValue(id, rowColumnId)));
  const rowValues = Array.from(rowValuesSet).sort((a, b) =>
    a.localeCompare(b, "ar")
  );

  const headerLevels: string[][] = headerColumnIds.map((colId) => {
    const set = new Set<string>();
    allRowIds.forEach((id) => set.add(getValue(id, colId)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  });

  function cartesian(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restProduct = cartesian(rest);
    const result: string[][] = [];

    first.forEach((val) => {
      restProduct.forEach((combo) => {
        result.push([val, ...combo]);
      });
    });

    return result;
  }

  const leafCombos = cartesian(headerLevels);

  const matrix: number[][] = rowValues.map(() =>
    leafCombos.map(() => 0)
  );

  allRowIds.forEach((id) => {
    const rowVal = getValue(id, rowColumnId);
    const rowIndex = rowValues.indexOf(rowVal);

    if (rowIndex === -1) return;

    const combo = headerColumnIds.map((colId) => getValue(id, colId));

    const comboIndex = leafCombos.findIndex((c) =>
      c.every((v, i) => v === combo[i])
    );

    if (comboIndex === -1) return;

    matrix[rowIndex][comboIndex] += 1;
  });

  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));

  const columnTotals = leafCombos.map((_, comboIndex) =>
    matrix.reduce((sum, row) => sum + row[comboIndex], 0)
  );

  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  return {
    rowValues,
    headerLevels,
    leafCombos,
    matrix,
    rowTotals,
    columnTotals,
    grandTotal,
  };
}

// =====================================================
// سجل تعديلات الكشف
// =====================================================

export interface SheetLog {
  id: string;
  sheet_id: string;
  message: string;
  created_at: string;
}

export async function fetchSheetLogs(sheetId: string): Promise<SheetLog[]> {
  const { data, error } = await supabase
    .from("sheet_logs")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

async function addSheetLog(sheetId: string, message: string) {
  const { error } = await supabase.from("sheet_logs").insert({
    sheet_id: sheetId,
    message,
  });

  if (error) {
    console.error("Add sheet log error:", error);
  }
}

export async function logSheetRowAdded(
  sheetId: string,
  userName: string,
  rowNumber: number
) {
  await addSheetLog(sheetId, `${userName} أضاف صف جديد رقم (${rowNumber})`);
}

export async function logSheetRowDeleted(
  sheetId: string,
  userName: string,
  rowNumber: number
) {
  await addSheetLog(sheetId, `${userName} حذف الصف رقم (${rowNumber})`);
}

export async function logSheetCellChanged(
  sheetId: string,
  userName: string,
  rowNumber: number,
  columnName: string,
  oldValue: string,
  newValue: string
) {
  await addSheetLog(
    sheetId,
    `${userName} عدّل العمود "${columnName}" في الصف رقم (${rowNumber}): "${
      oldValue || "-"
    }" ← "${newValue || "-"}"`
  );
}

export async function logSheetColumnAdded(
  sheetId: string,
  userName: string,
  columnName: string
) {
  await addSheetLog(sheetId, `${userName} أضاف عمود جديد باسم "${columnName}"`);
}

export async function logSheetColumnDeleted(
  sheetId: string,
  userName: string,
  columnName: string
) {
  await addSheetLog(sheetId, `${userName} حذف العمود "${columnName}"`);
}

export async function logSheetNameChanged(
  sheetId: string,
  userName: string,
  oldName: string,
  newName: string
) {
  await addSheetLog(
    sheetId,
    `${userName} غيّر اسم الكشف من "${oldName}" إلى "${newName}"`
  );
}

export async function logReportCreated(
  sheetId: string,
  userName: string,
  reportName: string
) {
  await addSheetLog(sheetId, `${userName} أنشأ يومية جديدة باسم "${reportName}"`);
}

export async function logReportDeleted(
  sheetId: string,
  userName: string,
  reportName: string
) {
  await addSheetLog(sheetId, `${userName} حذف يومية باسم "${reportName}"`);
}