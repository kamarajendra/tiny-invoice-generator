export type BusinessProfile = {
  name: string;
  email: string;
  address: string;
  paymentInstructions: string;
};

export type Client = {
  name: string;
  company: string;
  email: string;
};

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceDraft = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Paid";
  currency: string;
  notes: string;
  taxRate: number;
  discountRate: number;
  client: Client;
  business: BusinessProfile;
  lineItems: LineItem[];
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function calculateInvoiceTotals(draft: InvoiceDraft): InvoiceTotals {
  const subtotal = draft.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const discountAmount = subtotal * (draft.discountRate / 100);
  const taxedBase = subtotal - discountAmount;
  const taxAmount = taxedBase * (draft.taxRate / 100);
  const total = taxedBase + taxAmount;

  return {
    subtotal: roundCurrency(subtotal),
    discountAmount: roundCurrency(discountAmount),
    taxAmount: roundCurrency(taxAmount),
    total: roundCurrency(total),
  };
}

export function duplicateInvoice(draft: InvoiceDraft, allDrafts?: InvoiceDraft[]): InvoiceDraft {
  let nextNumber = draft.invoiceNumber;

  if (allDrafts && allDrafts.length > 0) {
    const numbers = allDrafts
      .map((d) => {
        const match = d.invoiceNumber.match(/INV-(\d{4})-(\d{3})/);
        return match ? Number(match[2]) : 0;
      })
      .filter((n) => n > 0);
    const maxNum = Math.max(...numbers, 0);
    const year = new Date().getFullYear();
    nextNumber = `INV-${year}-${String(maxNum + 1).padStart(3, "0")}`;
  }

  return {
    ...draft,
    invoiceNumber: nextNumber,
    lineItems: draft.lineItems.map((item) => ({ ...item, id: `${item.id}-copy` })),
  };
}

export function createLineItemId(lineItems: LineItem[]) {
  const nextIndex = lineItems.reduce((highest, item) => {
    const match = item.id.match(/^line-(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Math.max(highest, value);
  }, 0);

  return `line-${nextIndex + 1}`;
}

export function createDefaultInvoiceDraft(): InvoiceDraft {
  return {
    invoiceNumber: "INV-2026-001",
    issueDate: "2026-06-01",
    dueDate: "2026-06-15",
    status: "Draft",
    currency: "USD",
    notes: "Thanks for the project. Payment due within 14 days.",
    taxRate: 8,
    discountRate: 0,
    business: {
      name: "Studio North",
      email: "hello@studionorth.dev",
      address: "1142 Cedar Avenue\nPortland, OR 97205",
      paymentInstructions: "Bank transfer preferred. Reply by email for ACH details.",
    },
    client: {
      name: "Ari Patel",
      company: "Signal Workshop",
      email: "ari@signalworkshop.co",
    },
    lineItems: [
      {
        id: "line-1",
        description: "Landing page design sprint",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "line-2",
        description: "Design QA and handoff",
        quantity: 4,
        unitPrice: 95,
      },
    ],
  };
}
