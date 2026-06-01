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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded border border-[var(--color-border)] bg-[var(--color-print-bg)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]";
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function InvoiceApp() {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadDraft() ?? createDefaultInvoiceDraft());
  const [status, setStatus] = useState(() => (loadDraft() ? "Restored saved draft" : "New draft"));
  const totals = useMemo(() => calculateInvoiceTotals(draft), [draft]);

  useEffect(() => { saveDraft(draft); }, [draft]);

  function update<K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) {
    setDraft((cur) => ({ ...cur, [key]: value }));
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 lg:py-10 print:p-0">
      {/* Header bar */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
            TI
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold">Invoice Generator</h1>
            <p className="text-xs text-[var(--color-muted)]">Local-first, draft-saved, print-ready.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="hidden sm:inline">{status}</span>
          <span className="inline-flex h-2 w-2 rounded-full" style={{ background: status.includes("Restored") ? "var(--color-highlight)" : "var(--color-accent-soft)" }} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Editor panel */}
        <div className="space-y-6">
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <h2 className="font-serif text-lg font-bold">Invoice details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Invoice number">
                <input value={draft.invoiceNumber} onChange={(e) => update("invoiceNumber", e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Status">
                <select value={draft.status} onChange={(e) => update("status", e.target.value as InvoiceDraft["status"])} className={inputClass()}>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </Field>
              <Field label="Issue date">
                <input type="date" value={draft.issueDate} onChange={(e) => update("issueDate", e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Due date">
                <input type="date" value={draft.dueDate} onChange={(e) => update("dueDate", e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Currency">
                <select value={draft.currency} onChange={(e) => update("currency", e.target.value)} className={inputClass()}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <h2 className="font-serif text-lg font-bold">Business</h2>
            <div className="mt-4 space-y-3">
              <Field label="Name"><input value={draft.business.name} onChange={(e) => update("business", { ...draft.business, name: e.target.value })} className={inputClass()} /></Field>
              <Field label="Email"><input value={draft.business.email} onChange={(e) => update("business", { ...draft.business, email: e.target.value })} className={inputClass()} /></Field>
              <Field label="Address"><textarea value={draft.business.address} onChange={(e) => update("business", { ...draft.business, address: e.target.value })} className={`${inputClass()} min-h-20`} /></Field>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <h2 className="font-serif text-lg font-bold">Client</h2>
            <div className="mt-4 space-y-3">
              <Field label="Name"><input value={draft.client.name} onChange={(e) => update("client", { ...draft.client, name: e.target.value })} className={inputClass()} /></Field>
              <Field label="Company"><input value={draft.client.company} onChange={(e) => update("client", { ...draft.client, company: e.target.value })} className={inputClass()} /></Field>
              <Field label="Email"><input value={draft.client.email} onChange={(e) => update("client", { ...draft.client, email: e.target.value })} className={inputClass()} /></Field>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">Line items</h2>
              <button
                type="button"
                onClick={() => update("lineItems", [...draft.lineItems, { id: createLineItemId(draft.lineItems), description: "New item", quantity: 1, unitPrice: 0 }])}
                className="rounded border border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              >
                + Add line
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {draft.lineItems.map((item, i) => (
                <div key={item.id} className="flex flex-wrap items-end gap-2 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <input
                      value={item.description}
                      onChange={(e) => { const n = [...draft.lineItems]; n[i] = { ...item, description: e.target.value }; update("lineItems", n); }}
                      placeholder="Description"
                      className="w-full border-0 bg-transparent px-0 py-1 text-sm outline-none"
                    />
                  </div>
                  <input
                    type="number" min="0" step="1" value={item.quantity}
                    onChange={(e) => { const n = [...draft.lineItems]; n[i] = { ...item, quantity: Number(e.target.value) }; update("lineItems", n); }}
                    className="w-16 rounded border border-[var(--color-border)] px-3 py-2 text-sm text-center outline-none"
                  />
                  <input
                    type="number" min="0" step="0.01" value={item.unitPrice}
                    onChange={(e) => { const n = [...draft.lineItems]; n[i] = { ...item, unitPrice: Number(e.target.value) }; update("lineItems", n); }}
                    className="w-24 rounded border border-[var(--color-border)] px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => update("lineItems", draft.lineItems.filter((li) => li.id !== item.id))}
                    className="rounded border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tax rate (%)">
                <input type="number" min="0" step="0.1" value={draft.taxRate} onChange={(e) => update("taxRate", Number(e.target.value))} className={inputClass()} />
              </Field>
              <Field label="Discount rate (%)">
                <input type="number" min="0" step="0.1" value={draft.discountRate} onChange={(e) => update("discountRate", Number(e.target.value))} className={inputClass()} />
              </Field>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Payment instructions">
                <textarea value={draft.business.paymentInstructions} onChange={(e) => update("business", { ...draft.business, paymentInstructions: e.target.value })} className={`${inputClass()} min-h-20`} />
              </Field>
              <Field label="Notes">
                <textarea value={draft.notes} onChange={(e) => update("notes", e.target.value)} className={`${inputClass()} min-h-20`} />
              </Field>
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { saveDraft(draft); setStatus("Draft saved"); }}
              className="rounded bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => { setDraft(duplicateInvoice(draft)); setStatus("Duplicated"); }}
              className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2.5 text-sm font-medium hover:border-[var(--color-accent)]"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => { if (window.confirm("Reset to default draft? Current changes will be lost.")) { setDraft(createDefaultInvoiceDraft()); setStatus("Reset to default"); } }}
              className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2.5 text-sm font-medium hover:border-[var(--color-danger)]"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Preview panel - letter style */}
        <div className="print:block">
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">Preview</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="rounded bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white print:hidden">
                  Print / PDF
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-print-bg)] letter-preview print:rounded-none print:border-0">
              <div className="border-b border-[var(--color-border)] px-8 pb-6 pt-8 print:px-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-3xl font-bold tracking-tight">{draft.business.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">Invoice</div>
                  </div>
                  <div className="rounded bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                    {draft.status}
                  </div>
                </div>
                <div className="mt-6 text-sm text-[var(--color-ink-soft)]">
                  <span className="font-semibold text-[var(--foreground)]">{draft.invoiceNumber}</span>
                </div>
              </div>

              <div className="px-8 py-6 print:px-0">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">From</div>
                    <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-ink-soft)]">
                      {draft.business.name}{"\n"}{draft.business.email}{"\n"}{draft.business.address}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Bill to</div>
                    <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-ink-soft)]">
                      {draft.client.name}{"\n"}{draft.client.company}{"\n"}{draft.client.email}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Issue date</div>
                    <div className="mt-1 text-sm font-medium">{draft.issueDate}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Due date</div>
                    <div className="mt-1 text-sm font-medium">{draft.dueDate}</div>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded border border-[var(--color-border)]">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-[var(--color-canvas)]">
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">Description</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">Qty</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">Unit</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">Total</th>
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

                <div className="ml-auto mt-4 max-w-xs space-y-2 rounded bg-[var(--color-canvas)] p-4">
                  <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">Subtotal</span><span>{formatMoney(totals.subtotal, draft.currency)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">Discount</span><span>-{formatMoney(totals.discountAmount, draft.currency)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">Tax</span><span>{formatMoney(totals.taxAmount, draft.currency)}</span></div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(totals.total, draft.currency)}</span></div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Notes</div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-ink-soft)]">{draft.notes}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Payment</div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-ink-soft)]">{draft.business.paymentInstructions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
