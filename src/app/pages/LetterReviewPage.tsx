import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Download, Printer } from "lucide-react";
import type { CSSProperties } from "react";

import { supabase } from "../../lib/supabase";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type Soldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  rankId: string;
  unit: string;
  unitId: string;
  attachmentUnit: string;
  attachmentUnitId: string | null;
  dischargeDate: string | null;
};

type LetterData = {
  destination: string;
  attachmentPlace: string;
  reason: string;
  issuingUnitId?: string;
  attachmentUnitId?: string;
};

type PageState = {
  letterType?: "attachment" | "end-attachment";
  letterTypeId?: string;
  letterTypeCode?: string;
  letterTypeName?: string;
  soldiers?: Soldier[];
  letterData?: LetterData;
};

function LoadingModal() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.45)" }}
    >
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center"
        style={{
          width: "clamp(320px,50vw,560px)",
          padding: "70px 40px",
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="w-4 h-4 rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom,#00B867,#00522E)",
                animation: `reviewBounce 1.2s ease-in-out ${
                  item * 0.2
                }s infinite`,
              }}
            />
          ))}
        </div>

        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 32,
            color: "#122b16",
            marginTop: 30,
          }}
        >
          يرجى الانتظار
        </p>

        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#404040",
            marginTop: 12,
          }}
        >
          يتم حفظ الجواب وتحديث بيانات الأفراد الآن
        </p>
      </div>

      <style>
        {`
          @keyframes reviewBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 1;
            }

            40% {
              transform: translateY(-14px);
              opacity: .7;
            }
          }
        `}
      </style>
    </div>
  );
}

function SuccessModal({
  letterNumber,
}: {
  letterNumber: number | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.45)" }}
    >
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center text-center"
        style={{
          width: "clamp(320px,50vw,560px)",
          padding: "60px 40px",
        }}
        dir="rtl"
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom,#00B867,#00522E)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
        </div>

        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 32,
            color: "#122b16",
            marginTop: 30,
          }}
        >
          عملية ناجحة!
        </p>

        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#404040",
            marginTop: 15,
          }}
        >
          تم حفظ الخطاب وتحديث بيانات الأفراد بنجاح
        </p>

        {letterNumber !== null && (
          <p
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 18,
              color: "#00522E",
              marginTop: 10,
            }}
          >
            رقم الخطاب: {letterNumber}
          </p>
        )}

        <p
          style={{
            ...F,
            fontSize: 14,
            color: "#717d96",
            marginTop: 15,
          }}
        >
          جاري توجيهك للصفحة الرئيسية...
        </p>
      </div>
    </div>
  );
}

function StepBubble({
  number,
  label,
  done,
  active,
}: {
  number: string;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{
          borderColor: done
            ? "#00a85a"
            : active
              ? "#2d3648"
              : "#a1aebe",
          background: done ? "#00a85a" : "#fff",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 13,
            color: done ? "#fff" : "#2d3648",
          }}
        >
          {done ? "✓" : number}
        </span>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          color: done
            ? "#00864d"
            : active
              ? "#2d3648"
              : "#465668",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Stepper() {
  const steps = [
    "تحديد نوع الخطاب",
    "تحديد الأفراد",
    "بيانات الخطاب",
    "المراجعة والتصديق",
  ];

  return (
    <div
      className="flex items-start justify-center flex-wrap"
      dir="rtl"
    >
      {steps.map((step, index) => (
        <div key={step} className="flex items-start">
          <StepBubble
            number={`0${index + 1}`}
            label={step}
            done={index < 3}
            active={index === 3}
          />

          {index < 3 && (
            <div className="flex items-center gap-[3px] mt-4 mx-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] h-[3px] rounded-full"
                  style={{ background: "#1A202C" }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#717d96",
        }}
      >
        {label}
      </span>

      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#172e78",
        }}
      >
        :
      </span>

      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#2d3648",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function LetterPreview({
  soldiers,
  destination,
  attachmentPlace,
  reason,
  letterType,
  branchHeadName,
  branchHeadRank,
}: {
  soldiers: Soldier[];
  destination: string;
  attachmentPlace: string;
  reason: string;
  letterType: string;
  branchHeadName: string;
  branchHeadRank: string;
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const bodyType =
    letterType === "end-attachment"
      ? "إنهاء إلحاق"
      : "إلحاق";

  return (
    <div
      className="bg-white border border-[#ddd] rounded-[4px] p-8 w-full max-w-[680px] mx-auto shadow-sm"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b mb-4">
        <div className="flex flex-col text-right">
          <p style={{ ...F, fontSize: 13, fontWeight: 700 }}>
            قيادة قوات الصاعقة
          </p>

          <p style={{ ...F, fontSize: 12 }}>
            فرع التنظيم والإدارة
          </p>

          <p style={{ ...F, fontSize: 12 }}>
            التاريخ : {today}
          </p>
        </div>

        <div className="w-14 h-14">
          <img
            src={imgEagle}
            alt="شعار الجمهورية"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <p
        className="text-center"
        style={{
          ...F,
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        إلى / {destination || "..."}
      </p>

      <p
        style={{
          ...F,
          fontSize: 12,
          color: "#333",
          lineHeight: 1.8,
          marginBottom: 12,
        }}
      >
        قادم لكم اليوم الأفراد المذكور أسماؤهم وبياناتهم
        للعمل بإجراء {bodyType} بناءً على{" "}
        {reason || "أوامر قيادة"} بالأماكن الموضحة قرين كل
        منهم، وبياناتهم كالتالي:
      </p>

      <table
        className="w-full border-collapse mb-4"
        style={{
          ...F,
          fontSize: 11,
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            {[
              "م",
              "الدرجة",
              "الاسم",
              "الوحدة",
              "وحدة الإلحاق",
            ].map((header) => (
              <th
                key={header}
                style={{
                  padding: "5px",
                  border: "1px solid #ddd",
                  textAlign: "right",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {soldiers.map((soldier, index) => (
            <tr key={soldier.id}>
              <td
                style={{
                  padding: "5px",
                  border: "1px solid #eee",
                  textAlign: "center",
                }}
              >
                {index + 1}
              </td>

              <td
                style={{
                  padding: "5px",
                  border: "1px solid #eee",
                }}
              >
                {soldier.rank}
              </td>

              <td
                style={{
                  padding: "5px",
                  border: "1px solid #eee",
                }}
              >
                {soldier.name}
              </td>

              <td
                style={{
                  padding: "5px",
                  border: "1px solid #eee",
                }}
              >
                {soldier.unit}
              </td>

              <td
                style={{
                  padding: "5px",
                  border: "1px solid #eee",
                }}
              >
                {soldier.attachmentUnit ||
                  attachmentPlace ||
                  "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p
        className="text-center"
        style={{
          ...F,
          fontSize: 12,
          marginTop: 20,
        }}
      >
        مع وافر التحية ،،،
      </p>

      <div
        className="flex flex-col items-center gap-1 mt-8"
        style={{
          ...F,
          fontSize: 12,
        }}
      >
        <p style={{ fontWeight: 700 }}>
          {branchHeadRank || "جاري تحميل الرتبة"}
        </p>

        <p style={{ fontWeight: 700 }}>
          {branchHeadName || "جاري تحميل الاسم"}
        </p>

        <p>رئيس فرع التنظيم والإدارة</p>
      </div>
    </div>
  );
}

export function LetterReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as PageState | null;

  const letterType =
    state?.letterType === "end-attachment"
      ? "end-attachment"
      : "attachment";

  const soldiers = state?.soldiers ?? [];

  const letterData: LetterData =
    state?.letterData ?? {
      destination: "",
      attachmentPlace:
        soldiers[0]?.attachmentUnit ?? "",
      reason: "",
      issuingUnitId: soldiers[0]?.unitId,
      attachmentUnitId:
        soldiers[0]?.attachmentUnitId ?? undefined,
    };

  const [letterNumber, setLetterNumber] =
    useState<number | null>(null);

  const [branchHeadName, setBranchHeadName] =
    useState("");

  const [branchHeadRank, setBranchHeadRank] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError);

        setError(
          "حدث خطأ أثناء التحقق من جلسة الدخول."
        );
        return;
      }

      if (!session?.user) {
        setError(
          "لا توجد جلسة دخول فعالة. برجاء تسجيل الدخول مرة أخرى."
        );
      }
    };

    void checkSession();
  }, []);

  useEffect(() => {
    const loadBranchHead = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data, error } = await supabase
        .from("branch_heads")
        .select(`
          id,
          full_name,
          rank_id,
          rank:letter_officer_ranks!branch_heads_rank_id_fkey(
            name
          )
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Branch head error:", error);
        return;
      }

      if (!data) return;

      const rank = Array.isArray(data.rank)
        ? data.rank[0]
        : data.rank;

      setBranchHeadName(data.full_name ?? "");
      setBranchHeadRank(rank?.name ?? "");
    };

    void loadBranchHead();
  }, []);

  const saveLetter = useCallback(async () => {
    if (saving) return;

    if (!soldiers.length) {
      setError("لا يوجد أفراد في الخطاب.");
      return;
    }

    if (!state?.letterTypeId) {
      setError(
        "نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى."
      );
      return;
    }

    setSaving(true);
    setError("");

    let createdLetterId: string | null = null;

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          `خطأ في جلسة الدخول: ${sessionError.message}`
        );
      }

      if (!session?.user) {
        throw new Error(
          "جلسة تسجيل الدخول غير موجودة. من فضلك سجل الدخول مرة أخرى."
        );
      }

      const userId = session.user.id;

      const {
        data: letterTypeRow,
        error: typeError,
      } = await supabase
        .from("letter_types")
        .select("id,name,code")
        .eq("id", state.letterTypeId)
        .maybeSingle();

      if (typeError) {
        throw new Error(
          `خطأ في نوع الخطاب: ${typeError.message}`
        );
      }

      if (!letterTypeRow) {
        throw new Error(
          "نوع الخطاب غير موجود في قاعدة البيانات."
        );
      }

      const isAttach =
        letterTypeRow.code === "ATTACH";

      const isDetach =
        letterTypeRow.code === "DEATTACH";

      if (!isAttach && !isDetach) {
        throw new Error(
          `نوع الخطاب غير مدعوم: ${letterTypeRow.code}`
        );
      }

      const issuingUnitId =
        letterData.issuingUnitId ??
        soldiers[0]?.unitId;

      if (!issuingUnitId) {
        throw new Error(
          "لم يتم تحديد الوحدة الأساسية."
        );
      }

      const attachmentUnitId =
        letterData.attachmentUnitId ??
        soldiers[0]?.attachmentUnitId ??
        null;

      if (isAttach && !attachmentUnitId) {
        throw new Error(
          "خطاب الإلحاق يحتاج إلى تحديد وحدة الإلحاق."
        );
      }

      const finalAttachmentUnitId =
        isDetach ? null : attachmentUnitId;

      const newServiceStatusId = isAttach
        ? "d443b755-802a-4e5d-8a1b-0c372c5f94dd"
        : "b64822a7-38e3-4c98-b738-0f0f077bb6f2";

      const {
        data: branchHead,
        error: branchError,
      } = await supabase
        .from("branch_heads")
        .select(`
          id,
          full_name,
          rank_id,
          rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (branchError) {
        throw new Error(
          `خطأ في تحميل رئيس الفرع: ${branchError.message}`
        );
      }

      if (!branchHead) {
        throw new Error(
          "لا يوجد رئيس فرع نشط في قاعدة البيانات."
        );
      }

      const branchRank = Array.isArray(
        branchHead.rank
      )
        ? branchHead.rank[0]
        : branchHead.rank;

      const letterInsert = {
        letter_type_id: letterTypeRow.id,
        letter_date: new Date()
          .toISOString()
          .split("T")[0],
        issuing_unit_id: issuingUnitId,
        attachment_unit_id:
          finalAttachmentUnitId,
        reason:
          letterData.reason ||
          "أوامر قيادة",
        personnel_count: soldiers.length,
        branch_head_id: branchHead.id,
        branch_head_name:
          branchHead.full_name,
        branch_head_rank:
          branchRank?.name ?? "",
        status: "UNDOCUMENTED",
        created_by: userId,
      };

      const {
        data: newLetter,
        error: insertLetterError,
      } = await supabase
        .from("letters")
        .insert(letterInsert)
        .select("id, letter_number")
        .single();

      if (insertLetterError) {
        throw new Error(
          `خطأ في حفظ الخطاب: ${insertLetterError.message}`
        );
      }

      if (!newLetter) {
        throw new Error(
          "تعذر إنشاء الخطاب."
        );
      }

      createdLetterId = newLetter.id;

      const personnelRows = soldiers.map(
        (soldier) => ({
          letter_id: newLetter.id,
          personnel_id: soldier.id,
        })
      );

      const {
        error: personnelError,
      } = await supabase
        .from("letter_personnel")
        .insert(personnelRows);

      if (personnelError) {
        throw new Error(
          `تم إنشاء الخطاب ولكن فشل ربط الأفراد: ${personnelError.message}`
        );
      }

      const personnelIds = soldiers.map(
        (soldier) => soldier.id
      );

      const {
        error: updatePersonnelError,
      } = await supabase
        .from("personnel")
        .update({
          service_status_id:
            newServiceStatusId,
          attachment_unit_id:
            finalAttachmentUnitId,
          updated_at:
            new Date().toISOString(),
        })
        .in("id", personnelIds);

      if (updatePersonnelError) {
        throw new Error(
          `تم حفظ الخطاب وربط الأفراد، ولكن فشل تحديث حالة الأفراد: ${updatePersonnelError.message}`
        );
      }

      const {
        data: updatedPersonnel,
        error: verifyPersonnelError,
      } = await supabase
        .from("personnel")
        .select(
          "id, service_status_id, attachment_unit_id"
        )
        .in("id", personnelIds);

      if (verifyPersonnelError) {
        throw new Error(
          `تعذر التحقق من تحديث بيانات الأفراد: ${verifyPersonnelError.message}`
        );
      }

      if (
        !updatedPersonnel ||
        updatedPersonnel.length !==
          personnelIds.length
      ) {
        throw new Error(
          "لم يتم تحديث جميع الأفراد المحددين."
        );
      }

      const invalidPersonnel =
        updatedPersonnel.filter(
          (person) =>
            person.service_status_id !==
              newServiceStatusId ||
            person.attachment_unit_id !==
              finalAttachmentUnitId
        );

      if (invalidPersonnel.length > 0) {
        throw new Error(
          "فشل التحقق من تحديث حالة أو جهة إلحاق بعض الأفراد."
        );
      }

      setLetterNumber(
        newLetter.letter_number
      );

      setBranchHeadName(
        branchHead.full_name ?? ""
      );

      setBranchHeadRank(
        branchRank?.name ?? ""
      );

      setSaving(false);
      setSuccess(true);
    } catch (err) {
      console.error(
        "SAVE LETTER ERROR:",
        err
      );

      if (createdLetterId) {
        try {
          await supabase
            .from("letter_personnel")
            .delete()
            .eq(
              "letter_id",
              createdLetterId
            );

          await supabase
            .from("letters")
            .delete()
            .eq(
              "id",
              createdLetterId
            );
        } catch (rollbackError) {
          console.error(
            "ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      setSaving(false);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ الخطاب."
      );
    }
  }, [
    saving,
    soldiers,
    state,
    letterData,
  ]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      navigate("/dashboard");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : "اصدار خطاب إلحاق";

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        {pageTitle}
      </h1>

      <div className="flex justify-center">
        <Stepper />
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            ...F,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            بيانات الخطاب
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-6 py-5">
          <InfoPair
            label="نوع الخطاب"
            value={
              state?.letterTypeName ||
              (letterType === "end-attachment"
                ? "إنهاء إلحاق"
                : "إلحاق")
            }
          />

          <InfoPair
            label="رقم الخطاب"
            value={
              letterNumber !== null
                ? String(letterNumber)
                : "سيتم توليده عند الحفظ"
            }
          />

          <InfoPair
            label="جهة الخطاب"
            value={letterData.destination}
          />

          <InfoPair
            label="تاريخ الخطاب"
            value={new Date().toLocaleDateString(
              "en-GB"
            )}
          />

          <InfoPair
            label="الوحدة الأساسية"
            value={soldiers[0]?.unit ?? ""}
          />

          <InfoPair
            label="عدد الأفراد"
            value={String(soldiers.length)}
          />

          <InfoPair
            label="وحدة الإلحاق"
            value={
              letterType === "end-attachment"
                ? "سيتم إنهاء الإلحاق"
                : letterData.attachmentPlace ||
                  soldiers[0]?.attachmentUnit ||
                  "لا يوجد"
            }
          />

          <InfoPair
            label="رئيس الفرع"
            value={
              branchHeadName ||
              "جاري التحميل"
            }
          />
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            بيانات الأفراد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-[#f7f9fc]">
                {[
                  "درجة",
                  "اسم",
                  "الوحدة",
                  "وحدة الإلحاق",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-right border-b"
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 14,
                        color: "#717d96",
                      }}
                    >
                      {header}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {soldiers.map((soldier) => (
                <tr key={soldier.id}>
                  <td className="px-4 py-3 border-b">
                    {soldier.rank}
                  </td>

                  <td className="px-4 py-3 border-b">
                    {soldier.name}
                  </td>

                  <td className="px-4 py-3 border-b">
                    {soldier.unit}
                  </td>

                  <td className="px-4 py-3 border-b">
                    {letterType ===
                    "end-attachment"
                      ? "لا يوجد"
                      : soldier.attachmentUnit ||
                        letterData.attachmentPlace ||
                        "لا يوجد"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            معاينة الخطاب
          </span>
        </div>

        <div className="p-6 bg-[#f7f9fc]">
          <LetterPreview
            soldiers={soldiers}
            destination={
              letterData.destination
            }
            attachmentPlace={
              letterData.attachmentPlace
            }
            reason={letterData.reason}
            letterType={letterType}
            branchHeadName={
              branchHeadName
            }
            branchHeadRank={
              branchHeadRank
            }
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={saving || success}
          onClick={() => void saveLetter()}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px]"
          style={{
            background:
              "linear-gradient(to bottom,#00b867,#00522e)",
            opacity:
              saving || success ? 0.6 : 1,
          }}
        >
          <Printer size={16} color="#fff" />

          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#fff",
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : "تأكيد وحفظ الخطاب"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px] border border-[#2d3648] bg-white"
        >
          <Download
            size={16}
            color="#2d3648"
          />

          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#2d3648",
            }}
          >
            طباعة / تحميل المعاينة
          </span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            navigate("/dashboard")
          }
          className="min-h-[48px] px-4"
        >
          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#172e78",
              textDecoration: "underline",
            }}
          >
            إلغاء
          </span>
        </button>
      </div>

      {saving && <LoadingModal />}

      {success && (
        <SuccessModal
          letterNumber={letterNumber}
        />
      )}
    </div>
  );
}