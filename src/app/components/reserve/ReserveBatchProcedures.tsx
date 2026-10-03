import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Gavel,
  Send,
  Search,
  Link2,
  Unlink,
  ExternalLink,
  Loader2,
  Save,
  Trash2,
  Archive,
  X,
  Check,
  Pencil,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { logActivity } from "../../../lib/logActivity";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// =====================================================
// Helpers
// =====================================================

const toAr = (value: string | number) =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const toEnglishDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-");
  return toAr(`${d}/${m}/${y}`);
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function logReserve(action: string, details: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    await logActivity({
      userId: user.id,
      userName: profile?.username ?? "غير معروف",
      actionType: "UPDATE",
      action,
      entity: "reserve_batches",
      details,
    } as any);
  } catch {
    // التسجيل مش لازم يوقف الشغل
  }
}

type FaxBrief = {
  id: string;
  fax_number: number;
  fax_year: number;
  created_at: string;
  issuing_office_name: string | null;
  handed_over_at: string | null;
  original_received_at: string | null;
  recipients_count: number;
};

function faxLabel(fax: FaxBrief) {
  return `فاكس ${toAr(fax.fax_number)}/${toAr(fax.fax_year)} - ${formatDate(fax.created_at)}`;
}

function faxStatus(fax: FaxBrief): { text: string; bg: string; color: string } {
  if (fax.original_received_at) return { text: "تم الإرسال وعاد الأصل", bg: "#DCF4DF", color: "#00522E" };
  if (fax.recipients_count > 0 || fax.handed_over_at)
    return { text: "تم الإرسال", bg: "#e8f0fe", color: "#172e78" };
  return { text: "مسجل - لم يُوثق المستلم", bg: "#fff8e8", color: "#8a6500" };
}

// =====================================================
// اختيار فاكس صادر من الأرشيف
// =====================================================

function FaxPicker({
  busy,
  actionLabel,
  onPick,
  onCancel,
}: {
  busy: boolean;
  actionLabel: string;
  onPick: (faxId: string) => void;
  onCancel?: () => void;
}) {
  const [number, setNumber] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FaxBrief[]>([]);
  const [error, setError] = useState("");

  async function search() {
    const n = parseInt(toEnglishDigits(number).trim(), 10);
    const y = parseInt(toEnglishDigits(year).trim(), 10);

    setResults([]);
    setError("");

    if (!n || !y) {
      setError("اكتب رقم الفاكس والسنة.");
      return;
    }

    setSearching(true);
    const { data, error: rpcError } = await supabase.rpc("get_outgoing_fax_brief", {
      p_number: n,
      p_year: y,
    });
    setSearching(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("لا يوجد فاكس صادر بهذا الرقم في هذه السنة.");
      return;
    }

    setResults(data as FaxBrief[]);
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          inputMode="numeric"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="رقم الفاكس"
          dir="ltr"
          className="w-[120px] h-9 rounded-lg border border-[#cbd5e1] px-2 outline-none focus:border-[#00B867] text-left"
          style={{ ...F, fontSize: 13 }}
        />
        <input
          type="text"
          inputMode="numeric"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="السنة"
          dir="ltr"
          className="w-[80px] h-9 rounded-lg border border-[#cbd5e1] px-2 outline-none focus:border-[#00B867] text-left"
          style={{ ...F, fontSize: 13 }}
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
          style={{ ...F, fontSize: 12, fontWeight: 700 }}
        >
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          بحث
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[#64748b] hover:text-[#2d3648]">
            <X size={16} />
          </button>
        )}
      </div>

      {error && <p style={{ ...F, fontSize: 12, color: "#991b1b" }}>{error}</p>}

      {results.map((r) => {
        const s = faxStatus(r);
        return (
          <div key={r.id} className="flex items-center gap-2 flex-wrap rounded-lg border border-[#e2e7f0] p-2">
            <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>{faxLabel(r)}</span>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ ...F, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}
            >
              {s.text}
            </span>
            <button
              type="button"
              onClick={() => onPick(r.id)}
              disabled={busy}
              className="flex items-center gap-1 px-3 h-8 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50 mr-auto"
              style={{ ...F, fontSize: 12, fontWeight: 700 }}
            >
              <Link2 size={13} />
              {actionLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// نافذة تسجيل شهادة إنهاء الخدمة
// =====================================================

export function CertificateDialog({
  soldierLabel,
  saving,
  onCancel,
  onConfirm,
}: {
  soldierLabel: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (number: string, date: string) => void;
}) {
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(todayIso());

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-[16px] p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="flex-1" style={{ ...F, fontSize: 18, fontWeight: 700, color: "#2d3648" }}>
            شهادة إنهاء الخدمة
          </span>
          <button type="button" onClick={onCancel} disabled={saving} className="text-[#aaa] hover:text-[#555]">
            <X size={20} />
          </button>
        </div>

        <p style={{ ...F, fontSize: 14, color: "#717d96" }}>{soldierLabel}</p>

        <div className="flex flex-col gap-1">
          <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم الشهادة (من هيئة التنظيم والإدارة) *</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            autoFocus
            className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
            style={{ ...F, fontSize: 14 }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ ...F, fontSize: 13, color: "#717d96" }}>تاريخ الشهادة *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
            style={{ ...F, fontSize: 14 }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onConfirm(number.trim(), date)}
            disabled={saving || !number.trim() || !date}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-white disabled:opacity-50"
            style={{ ...F, fontSize: 14, background: "linear-gradient(to bottom, #00b867, #00522e)" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            تسجيل الشهادة
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-[8px]"
            style={{ ...F, fontSize: 14, color: "#888" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// =====================================================
// إجراءات الدفعة
// =====================================================

export type ProcedureSoldier = {
  id: string;
  unitId: string | null;
  unit: string;
  militaryId: string;
  name: string;
};

type Shipment = {
  id: string;
  sent_date: string;
  delegate_name: string | null;
  notes: string | null;
  personnel_ids: string[];
};

export function ReserveBatchProcedures({
  batch,
  soldiers,
  checkedIds,
  canManage,
  onRecordsMapChange,
}: {
  batch: { id: string; batch_date: string; name: string | null };
  soldiers: ProcedureSoldier[];
  checkedIds: string[];
  canManage: boolean;
  onRecordsMapChange: (map: Record<string, string>) => void;
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // القرار
  const [decision, setDecision] = useState<{ number: string; date: string; authority: string } | null>(null);
  const [editingDecision, setEditingDecision] = useState(false);
  const [decNumber, setDecNumber] = useState("");
  const [decDate, setDecDate] = useState("");
  const [decAuthority, setDecAuthority] = useState("السجلات العسكرية");

  // الإخطار
  const [notifications, setNotifications] = useState<Record<string, { id: string; fax: FaxBrief | null }>>({});
  const [pickingUnit, setPickingUnit] = useState<string | null>(null);
  const [pickingAll, setPickingAll] = useState(false);

  // الإرساليات
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipDate, setShipDate] = useState(todayIso());
  const [shipDelegate, setShipDelegate] = useState("");
  const [shipNotes, setShipNotes] = useState("");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.id]);

  async function load() {
    setLoading(true);

    const [batchRes, notifyRes, shipRes] = await Promise.all([
      supabase
        .from("reserve_batches")
        .select("start_decision_number, start_decision_date, start_decision_authority")
        .eq("id", batch.id)
        .maybeSingle(),
      supabase.from("reserve_batch_unit_notifications").select("id, unit_id, fax_id").eq("reserve_batch_id", batch.id),
      supabase
        .from("reserve_batch_record_shipments")
        .select("id, sent_date, delegate_name, notes, items:reserve_batch_record_shipment_items(personnel_id)")
        .eq("reserve_batch_id", batch.id)
        .order("sent_date", { ascending: true }),
    ]);

    const b: any = batchRes.data;
    if (b?.start_decision_number) {
      setDecision({
        number: b.start_decision_number,
        date: b.start_decision_date,
        authority: b.start_decision_authority ?? "",
      });
    } else {
      setDecision(null);
    }

    // الفاكسات المربوطة
    const rows: any[] = notifyRes.data ?? [];
    const faxIds = Array.from(new Set(rows.map((r) => r.fax_id)));
    const briefs: Record<string, FaxBrief> = {};

    await Promise.all(
      faxIds.map(async (id) => {
        const { data } = await supabase.rpc("get_outgoing_fax_brief", { p_fax_id: id });
        const brief = ((data ?? []) as FaxBrief[])[0];
        if (brief) briefs[id] = brief;
      })
    );

    const nextNotifications: Record<string, { id: string; fax: FaxBrief | null }> = {};
    rows.forEach((r) => {
      nextNotifications[r.unit_id] = { id: r.id, fax: briefs[r.fax_id] ?? null };
    });
    setNotifications(nextNotifications);

    // الإرساليات
    const nextShipments: Shipment[] = (shipRes.data ?? []).map((s: any) => ({
      id: s.id,
      sent_date: s.sent_date,
      delegate_name: s.delegate_name,
      notes: s.notes,
      personnel_ids: (s.items ?? []).map((i: any) => i.personnel_id),
    }));
    setShipments(nextShipments);

    const recordsMap: Record<string, string> = {};
    nextShipments.forEach((s) => s.personnel_ids.forEach((pid) => (recordsMap[pid] = s.sent_date)));
    onRecordsMapChange(recordsMap);

    setLoading(false);
  }

  function flash(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3000);
  }

  const batchLabel = batch.name || `دفعة ${formatDate(batch.batch_date)}`;

  // الوحدات اللي فيها مجندين من الدفعة
  const units = useMemo(() => {
    const map = new Map<string, { unitId: string; name: string; count: number }>();
    soldiers.forEach((s) => {
      if (!s.unitId) return;
      const item = map.get(s.unitId) ?? { unitId: s.unitId, name: s.unit, count: 0 };
      item.count += 1;
      map.set(s.unitId, item);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [soldiers]);

  const notifiedCount = units.filter((u) => notifications[u.unitId]).length;
  const pendingUnits = units.filter((u) => !notifications[u.unitId]);

  const sentIds = useMemo(() => new Set(shipments.flatMap((s) => s.personnel_ids)), [shipments]);
  const checkedNotSent = checkedIds.filter((id) => !sentIds.has(id));

  // ===================================================
  // القرار
  // ===================================================

  async function saveDecision() {
    setBusy(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("set_reserve_batch_start_decision", {
      p_batch_id: batch.id,
      p_number: decNumber.trim(),
      p_date: decDate || null,
      p_authority: decAuthority.trim(),
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setEditingDecision(false);
    flash("تم حفظ قرار بدء الإجراءات.");
    await logReserve("تسجيل قرار بدء إجراءات دفعة", `${batchLabel} - قرار ${decNumber.trim()}`);
    await load();
  }

  // ===================================================
  // الإخطار
  // ===================================================

  async function linkFax(unitIds: string[], faxId: string) {
    if (unitIds.length === 0) return;

    setBusy(true);
    setError("");

    const { error: insertError } = await supabase.from("reserve_batch_unit_notifications").insert(
      unitIds.map((unitId) => ({ reserve_batch_id: batch.id, unit_id: unitId, fax_id: faxId }))
    );

    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPickingUnit(null);
    setPickingAll(false);
    flash(`تم ربط فاكس الإخطار بـ ${toAr(unitIds.length)} وحدة.`);
    await logReserve("ربط فاكس إخطار وحدات دفعة", `${batchLabel} - ${unitIds.length} وحدة`);
    await load();
  }

  async function unlinkFax(unitId: string) {
    const item = notifications[unitId];
    if (!item || !window.confirm("فك ربط فاكس الإخطار عن الوحدة دي؟")) return;

    setBusy(true);
    const { error: deleteError } = await supabase.from("reserve_batch_unit_notifications").delete().eq("id", item.id);
    setBusy(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await load();
  }

  // ===================================================
  // الإرسال للسجلات
  // ===================================================

  async function createShipment() {
    if (checkedNotSent.length === 0) {
      setError("حدد من الجدول الأفراد اللي اتبعتت ملفاتهم (ومتبعتوش قبل كده).");
      return;
    }

    if (!shipDate) {
      setError("اختر تاريخ الإرسال.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("create_reserve_batch_shipment", {
      p_batch_id: batch.id,
      p_sent_date: shipDate,
      p_delegate_name: shipDelegate.trim() || null,
      p_notes: shipNotes.trim() || null,
      p_personnel_ids: checkedNotSent,
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setShipDelegate("");
    setShipNotes("");
    flash(`تم تسجيل إرسال ${toAr(checkedNotSent.length)} ملف للسجلات العسكرية.`);
    await logReserve(
      "تسجيل إرسال ملفات للسجلات العسكرية",
      `${batchLabel} - ${checkedNotSent.length} فرد - المندوب: ${shipDelegate.trim() || "-"}`
    );
    await load();
  }

  async function deleteShipment(shipment: Shipment) {
    if (
      !window.confirm(
        `حذف إرسالية ${formatDate(shipment.sent_date)} (${toAr(shipment.personnel_ids.length)} فرد)؟ الأفراد هيرجعوا "لم يُرسل".`
      )
    ) {
      return;
    }

    setBusy(true);
    const { error: deleteError } = await supabase.from("reserve_batch_record_shipments").delete().eq("id", shipment.id);
    setBusy(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await logReserve("حذف إرسالية للسجلات العسكرية", `${batchLabel} - ${formatDate(shipment.sent_date)}`);
    await load();
  }

  // ===================================================
  // Render
  // ===================================================

  const cardClass = "bg-white rounded-[20px] border border-[#eff0f6] p-5 flex flex-col gap-3";
  const inputClass = "h-10 rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 no-print">
        <Loader2 size={20} className="animate-spin text-[#00B867]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4 no-print" dir="rtl">
      <p style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>إجراءات الدفعة</p>

      {error && (
        <div
          className="rounded-[10px] px-4 py-3 flex items-center justify-between"
          style={{ background: "#fce9ea", color: "#9d2e15", ...F, fontSize: 14 }}
        >
          {error}
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-[10px] px-4 py-3" style={{ background: "#dcfce7", color: "#166534", ...F, fontSize: 14 }}>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* ١) القرار */}
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <Gavel size={18} className="text-[#00522E]" />
            <p style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>قرار بدء الإجراءات</p>
            <span
              className="px-2 py-0.5 rounded-full mr-auto"
              style={{
                ...F,
                fontSize: 11,
                fontWeight: 700,
                background: decision ? "#DCF4DF" : "#fff8e8",
                color: decision ? "#00522E" : "#8a6500",
              }}
            >
              {decision ? "مسجل" : "لم يُسجل"}
            </span>
          </div>

          {decision && !editingDecision ? (
            <>
              <div className="flex flex-col gap-1" style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                <span>
                  رقم القرار: <b>{decision.number}</b>
                </span>
                <span>
                  التاريخ: <b>{formatDate(decision.date)}</b>
                </span>
                <span>
                  الجهة: <b>{decision.authority || "-"}</b>
                </span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setDecNumber(decision.number);
                    setDecDate(decision.date);
                    setDecAuthority(decision.authority);
                    setEditingDecision(true);
                  }}
                  className="flex items-center gap-1 w-fit px-3 h-8 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                  style={{ ...F, fontSize: 12, fontWeight: 700 }}
                >
                  <Pencil size={12} />
                  تعديل
                </button>
              )}
            </>
          ) : canManage ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={decNumber}
                onChange={(e) => setDecNumber(e.target.value)}
                placeholder="رقم القرار *"
                className={inputClass}
                style={{ ...F, fontSize: 13 }}
              />
              <input
                type="date"
                value={decDate}
                onChange={(e) => setDecDate(e.target.value)}
                className={inputClass}
                style={{ ...F, fontSize: 13 }}
              />
              <input
                type="text"
                value={decAuthority}
                onChange={(e) => setDecAuthority(e.target.value)}
                placeholder="الجهة المصدرة"
                className={inputClass}
                style={{ ...F, fontSize: 13 }}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveDecision()}
                  disabled={busy || !decNumber.trim() || !decDate}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                  style={{ ...F, fontSize: 13, fontWeight: 700 }}
                >
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  حفظ
                </button>
                {editingDecision && (
                  <button
                    type="button"
                    onClick={() => setEditingDecision(false)}
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p style={{ ...F, fontSize: 13, color: "#94a3b8" }}>لم يُسجل قرار بدء الإجراءات بعد.</p>
          )}
        </div>

        {/* ٢) إخطار الوحدات */}
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <Send size={18} className="text-[#172e78]" />
            <p style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>إخطار الوحدات</p>
            <span
              className="px-2 py-0.5 rounded-full mr-auto"
              style={{
                ...F,
                fontSize: 11,
                fontWeight: 700,
                background: units.length > 0 && notifiedCount === units.length ? "#DCF4DF" : "#fff8e8",
                color: units.length > 0 && notifiedCount === units.length ? "#00522E" : "#8a6500",
              }}
            >
              {toAr(notifiedCount)} من {toAr(units.length)} وحدة
            </span>
          </div>

          {canManage && pendingUnits.length > 1 && (
            pickingAll ? (
              <FaxPicker
                busy={busy}
                actionLabel={`ربط بـ ${toAr(pendingUnits.length)} وحدة`}
                onPick={(faxId) => void linkFax(pendingUnits.map((u) => u.unitId), faxId)}
                onCancel={() => setPickingAll(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPickingAll(true);
                  setPickingUnit(null);
                }}
                className="flex items-center gap-1.5 w-fit px-3 h-8 rounded-lg bg-[#e8f0fe] text-[#172e78] hover:opacity-80"
                style={{ ...F, fontSize: 12, fontWeight: 700 }}
              >
                <Link2 size={13} />
                ربط فاكس واحد بكل الوحدات المتبقية
              </button>
            )
          )}

          <div className="flex flex-col max-h-[340px] overflow-y-auto">
            {units.length === 0 ? (
              <p style={{ ...F, fontSize: 13, color: "#94a3b8" }}>لا توجد وحدات.</p>
            ) : (
              units.map((u) => {
                const item = notifications[u.unitId];
                const status = item?.fax ? faxStatus(item.fax) : null;

                return (
                  <div key={u.unitId} className="py-2 border-b border-[#eff0f6] last:border-b-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item ? (
                        <Check size={14} className="text-[#00B867]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#cbd5e1]" />
                      )}
                      <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>{u.name}</span>
                      <span style={{ ...F, fontSize: 11, color: "#94a3b8" }}>({toAr(u.count)} مجند)</span>

                      {item?.fax ? (
                        <div className="flex items-center gap-1.5 mr-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/archive/outgoing/${item.fax!.id}`)}
                            className="flex items-center gap-1 hover:underline"
                            style={{ ...F, fontSize: 11, color: "#1f3d97" }}
                          >
                            {faxLabel(item.fax)}
                            <ExternalLink size={11} />
                          </button>
                          {status && (
                            <span
                              className="px-1.5 py-0.5 rounded-full"
                              style={{ ...F, fontSize: 10, fontWeight: 700, background: status.bg, color: status.color }}
                            >
                              {status.text}
                            </span>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => void unlinkFax(u.unitId)}
                              disabled={busy}
                              title="فك الربط"
                              className="text-[#991b1b] disabled:opacity-40"
                            >
                              <Unlink size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        canManage &&
                        pickingUnit !== u.unitId && (
                          <button
                            type="button"
                            onClick={() => {
                              setPickingUnit(u.unitId);
                              setPickingAll(false);
                            }}
                            className="mr-auto flex items-center gap-1 px-2 h-7 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                            style={{ ...F, fontSize: 11, fontWeight: 700 }}
                          >
                            <Link2 size={12} />
                            ربط فاكس
                          </button>
                        )
                      )}
                    </div>

                    {pickingUnit === u.unitId && (
                      <FaxPicker
                        busy={busy}
                        actionLabel="ربط"
                        onPick={(faxId) => void linkFax([u.unitId], faxId)}
                        onCancel={() => setPickingUnit(null)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ٣) الإرسال للسجلات العسكرية */}
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-[#00522E]" />
            <p style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>الإرسال للسجلات العسكرية</p>
            <span
              className="px-2 py-0.5 rounded-full mr-auto"
              style={{
                ...F,
                fontSize: 11,
                fontWeight: 700,
                background: soldiers.length > 0 && sentIds.size === soldiers.length ? "#DCF4DF" : "#e8f0fe",
                color: soldiers.length > 0 && sentIds.size === soldiers.length ? "#00522E" : "#172e78",
              }}
            >
              {toAr(sentIds.size)} من {toAr(soldiers.length)}
            </span>
          </div>

          {shipments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {shipments.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
                  <div className="flex flex-col">
                    <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
                      {formatDate(s.sent_date)} — {toAr(s.personnel_ids.length)} ملف
                    </span>
                    <span style={{ ...F, fontSize: 11, color: "#717d96" }}>
                      المندوب: {s.delegate_name || "-"}
                      {s.notes ? ` • ${s.notes}` : ""}
                    </span>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void deleteShipment(s)}
                      disabled={busy}
                      title="حذف الإرسالية"
                      className="mr-auto text-[#991b1b] disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#eff0f6]">
              <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
                حدد الأفراد من الجدول، وبعدين سجّل الإرسالية. المحددين حاليًا ولم يُرسلوا:{" "}
                <b style={{ color: "#2d3648" }}>{toAr(checkedNotSent.length)}</b>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className={inputClass}
                  style={{ ...F, fontSize: 13 }}
                />
                <input
                  type="text"
                  value={shipDelegate}
                  onChange={(e) => setShipDelegate(e.target.value)}
                  placeholder="اسم المندوب"
                  className={`${inputClass} flex-1 min-w-[140px]`}
                  style={{ ...F, fontSize: 13 }}
                />
              </div>
              <input
                type="text"
                value={shipNotes}
                onChange={(e) => setShipNotes(e.target.value)}
                placeholder="ملاحظات (اختياري)"
                className={inputClass}
                style={{ ...F, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => void createShipment()}
                disabled={busy || checkedNotSent.length === 0}
                className="flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                style={{ ...F, fontSize: 13, fontWeight: 700 }}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                تسجيل إرسال {toAr(checkedNotSent.length)} ملف
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}