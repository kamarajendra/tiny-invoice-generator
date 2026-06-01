import { InvoiceDraft } from "@/lib/invoice";

export const STORAGE_KEY = "tiny-invoice-generator:draft";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveDraft(draft: InvoiceDraft) {
  if (!hasStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadDraft(): InvoiceDraft | null {
  if (!hasStorage()) {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as InvoiceDraft;
}
