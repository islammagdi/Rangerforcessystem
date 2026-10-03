import { useSyncExternalStore } from "react";

export type FlowMethod = "فرد واحد" | "مجموعة افراد";

export type IndividualFormValues = {
  category: "مجند" | "متطوع";
  milId: string;
  rank: string;
  name: string;
  unit: string;
  status: string;
  attachment: string;
  jobId: string;
  dischargeBatchId: string;
};

export type GroupFlowData = {
  file: File | null;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  // نتيجة التحليل + تعديلات المراجعة (rows بعد التعديل)
  rows: any[] | null;
};

export type AddSoldierFlowState = {
  method: FlowMethod;
  individual: IndividualFormValues | null;
  // الحالة اللي اتبعتت لصفحة المراجعة (الفرد الواحد)
  individualReview: any | null;
  group: GroupFlowData;
};

const EMPTY: AddSoldierFlowState = {
  method: "فرد واحد",
  individual: null,
  individualReview: null,
  group: { file: null, fileName: "", fileSize: "", fileUrl: "", rows: null },
};

let state: AddSoldierFlowState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getAddSoldierFlow() {
  return state;
}

export function useAddSoldierFlow() {
  return useSyncExternalStore(subscribe, getAddSoldierFlow, getAddSoldierFlow);
}

export function patchAddSoldierFlow(patch: Partial<AddSoldierFlowState>) {
  state = { ...state, ...patch };
  emit();
}

export function patchGroupFlow(patch: Partial<GroupFlowData>) {
  state = { ...state, group: { ...state.group, ...patch } };
  emit();
}

export function resetAddSoldierFlow() {
  if (state.group.fileUrl) {
    try {
      URL.revokeObjectURL(state.group.fileUrl);
    } catch {
      /* ignore */
    }
  }
  state = EMPTY;
  emit();
}