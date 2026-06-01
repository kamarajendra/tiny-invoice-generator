"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateInvoiceTotals,
  createLineItemId,
  createDefaultInvoiceDraft,
  duplicateInvoice,
  type InvoiceDraft,
} from "@/lib/invoice";
import { loadDraft, saveDraft } from "@/lib/storage";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 outline-none focus:border-[var(--color-accent)]";
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function InvoiceApp() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadDraft() ?? createDefaultInvoiceDraft());
  const [status, setStatus] = useState(() => (loadDraft() ? "Restored saved draft" : "Draft ready"));

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const totals = useMemo(() => calculateInvoiceTotals(draft), [draft]);

  function update<K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-10 print:px-0 print:py-0">
      <section className="grid gap-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_16px_60px_rgba(23,31,45,0.08)] lg:grid-cols-[1.02fr_0.98fr] lg:p-8 print:hidden">
        <div className="space-y-5">
          <div className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
            Local-first invoicing
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Draft invoices fast, keep them local, print them clean.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Tiny Invoice Generator stores business details, client info, and invoice drafts in your browser. Ideal for freelancers who want zero backend setup.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Persistence", "Browser storage"],
              ["Output", "Print-friendly invoice"],
              ["Workflow", "Duplicate and revise drafts"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                    <div className="text-sm text-[var(--color-muted)]">{label}</div>
                    <div className="mt-2 text-xl font-semibold">{value}</div>
                  </div>
                ))}
              </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] bg-[var(--color-canvas)] p-5">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-[var(--color-muted)]">Invoice status</div>
              <div className="mt-2 text-2xl font-semibold">{status}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  saveDraft(draft);
                  setStatus("Draft saved locally");
                }}
                className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 font-medium text-white"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(duplicateInvoice(draft));
                  setStatus("Created duplicate draft");
                }}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-3 font-medium"
              >
                Duplicate invoice
              </button>
            </div>
          </div>
          <div className="mt-6 text-sm leading-6 text-[var(--color-muted)]">
            Tip: use your browser&apos;s print dialog to export a PDF once the preview looks right.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 print:hidden">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice number">
              <input value={draft.invoiceNumber} onChange={(event) => update("invoiceNumber", event.target.value)} className={inputClassName()} />
            </Field>
            <Field label="Currency">
              <select value={draft.currency} onChange={(event) => update("currency", event.target.value)} className={inputClassName()}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </Field>
            <Field label="Issue date">
              <input type="date" value={draft.issueDate} onChange={(event) => update("issueDate", event.target.value)} className={inputClassName()} />
            </Field>
            <Field label="Due date">
              <input type="date" value={draft.dueDate} onChange={(event) => update("dueDate", event.target.value)} className={inputClassName()} />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Business</h2>
              <Field label="Name">
                <input value={draft.business.name} onChange={(event) => update("business", { ...draft.business, name: event.target.value })} className={inputClassName()} />
              </Field>
              <Field label="Email">
                <input value={draft.business.email} onChange={(event) => update("business", { ...draft.business, email: event.target.value })} className={inputClassName()} />
              </Field>
              <Field label="Address">
                <textarea value={draft.business.address} onChange={(event) => update("business", { ...draft.business, address: event.target.value })} className={`${inputClassName()} min-h-28`} />
              </Field>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Client</h2>
              <Field label="Name">
                <input value={draft.client.name} onChange={(event) => update("client", { ...draft.client, name: event.target.value })} className={inputClassName()} />
              </Field>
              <Field label="Company">
                <input value={draft.client.company} onChange={(event) => update("client", { ...draft.client, company: event.target.value })} className={inputClassName()} />
              </Field>
              <Field label="Email">
                <input value={draft.client.email} onChange={(event) => update("client", { ...draft.client, email: event.target.value })} className={inputClassName()} />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Line items</h2>
              <button
                type="button"
                onClick={() =>
                  update("lineItems", [
                    ...draft.lineItems,
                    {
                      id: createLineItemId(draft.lineItems),
                      description: "New item",
                      quantity: 1,
                      unitPrice: 0,
                    },
                  ])
                }
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Add line
              </button>
            </div>
            <div className="space-y-4">
              {draft.lineItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-canvas)] p-4 md:grid-cols-[1.6fr_0.5fr_0.6fr]">
                  <input
                    value={item.description}
                    onChange={(event) => {
                      const next = [...draft.lineItems];
                      next[index] = { ...item, description: event.target.value };
                      update("lineItems", next);
                    }}
                    className={inputClassName()}
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => {
                      const next = [...draft.lineItems];
                      next[index] = { ...item, quantity: Number(event.target.value) };
                      update("lineItems", next);
                    }}
                    className={inputClassName()}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => {
                      const next = [...draft.lineItems];
                      next[index] = { ...item, unitPrice: Number(event.target.value) };
                      update("lineItems", next);
                    }}
                    className={inputClassName()}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "lineItems",
                        draft.lineItems.filter((lineItem) => lineItem.id !== item.id),
                      )
                    }
                    className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium md:col-span-3"
                  >
                    Remove line item
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tax rate (%)">
              <input type="number" min="0" step="0.1" value={draft.taxRate} onChange={(event) => update("taxRate", Number(event.target.value))} className={inputClassName()} />
            </Field>
            <Field label="Discount rate (%)">
              <input type="number" min="0" step="0.1" value={draft.discountRate} onChange={(event) => update("discountRate", Number(event.target.value))} className={inputClassName()} />
            </Field>
          </div>

          <Field label="Payment instructions">
            <textarea value={draft.business.paymentInstructions} onChange={(event) => update("business", { ...draft.business, paymentInstructions: event.target.value })} className={`${inputClassName()} min-h-24`} />
          </Field>

          <Field label="Notes">
            <textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} className={`${inputClassName()} min-h-24`} />
          </Field>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-6 shadow-[0_18px_60px_rgba(27,31,45,0.08)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Invoice</div>
              <h2 className="mt-3 text-3xl font-semibold">{draft.invoiceNumber}</h2>
            </div>
            <button type="button" onClick={() => window.print()} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium print:hidden">
              Print / PDF
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">From</div>
              <div className="mt-3 whitespace-pre-line text-[var(--color-ink-soft)]">{draft.business.name}{"\n"}{draft.business.email}{"\n"}{draft.business.address}</div>
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Bill to</div>
              <div className="mt-3 whitespace-pre-line text-[var(--color-ink-soft)]">{draft.client.name}{"\n"}{draft.client.company}{"\n"}{draft.client.email}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--color-canvas)] p-4">
              <div className="text-sm text-[var(--color-muted)]">Issue date</div>
              <div className="mt-2 font-semibold">{draft.issueDate}</div>
            </div>
            <div className="rounded-2xl bg-[var(--color-canvas)] p-4">
              <div className="text-sm text-[var(--color-muted)]">Due date</div>
              <div className="mt-2 font-semibold">{draft.dueDate}</div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-[var(--color-border)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--color-canvas)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {draft.lineItems.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatMoney(item.unitPrice, draft.currency)}</td>
                    <td className="px-4 py-3">{formatMoney(item.quantity * item.unitPrice, draft.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 ml-auto max-w-sm space-y-3 rounded-[24px] bg-[var(--color-canvas)] p-5">
            <div className="flex items-center justify-between"><span className="text-[var(--color-muted)]">Subtotal</span><span>{formatMoney(totals.subtotal, draft.currency)}</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--color-muted)]">Discount</span><span>-{formatMoney(totals.discountAmount, draft.currency)}</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--color-muted)]">Tax</span><span>{formatMoney(totals.taxAmount, draft.currency)}</span></div>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-lg font-semibold"><span>Total</span><span>{formatMoney(totals.total, draft.currency)}</span></div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Notes</div>
              <p className="mt-3 whitespace-pre-line leading-7 text-[var(--color-ink-soft)]">{draft.notes}</p>
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Payment instructions</div>
              <p className="mt-3 whitespace-pre-line leading-7 text-[var(--color-ink-soft)]">{draft.business.paymentInstructions}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
