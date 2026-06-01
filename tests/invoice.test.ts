import { describe, expect, it } from "vitest";

import {
  calculateInvoiceTotals,
  createLineItemId,
  createDefaultInvoiceDraft,
  duplicateInvoice,
} from "@/lib/invoice";

describe("invoice helpers", () => {
  it("calculates subtotal, discount, tax, and total", () => {
    const draft = createDefaultInvoiceDraft();
    draft.discountRate = 10;
    draft.taxRate = 8;

    const totals = calculateInvoiceTotals(draft);

    expect(totals.subtotal).toBe(1580);
    expect(totals.discountAmount).toBe(158);
    expect(totals.taxAmount).toBe(113.76);
    expect(totals.total).toBe(1535.76);
  });

  it("duplicates invoice number and line item ids", () => {
    const draft = createDefaultInvoiceDraft();

    const copy = duplicateInvoice(draft);

    expect(copy.invoiceNumber).toBe("INV-2026-001-COPY");
    expect(copy.lineItems[0]?.id).toBe("line-1-copy");
  });

  it("creates a new line item id without colliding after removals", () => {
    const draft = createDefaultInvoiceDraft();
    const nextLineItems = draft.lineItems.filter((item) => item.id !== "line-1");

    expect(createLineItemId(nextLineItems)).toBe("line-3");
  });

  it("starts new drafts in Draft status", () => {
    const draft = createDefaultInvoiceDraft();

    expect(draft.status).toBe("Draft");
  });
});
