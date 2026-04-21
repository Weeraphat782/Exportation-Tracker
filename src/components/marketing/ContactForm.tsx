"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { trackFormSubmit } from "@/lib/analytics";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    setError(null);
    setSuccess(false);
    setLoading(true);

    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const company = String(fd.get("company") ?? "").trim();
    const inquiry = String(fd.get("inquiry") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || undefined,
          inquiryType: inquiry || undefined,
          message,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      trackFormSubmit("contact");
      setSuccess(true);
      form.reset();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={onSubmit}>
      {success && (
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Thank you — we received your message and will respond within one business day.
        </div>
      )}

      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={loading}
            autoComplete="name"
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm transition-colors disabled:opacity-60"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            autoComplete="email"
            className="mt-1 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm transition-colors disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium text-neutral-700"
        >
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          disabled={loading}
          autoComplete="organization"
          className="mt-1 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm transition-colors disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="inquiry"
          className="block text-sm font-medium text-neutral-700"
        >
          Inquiry Type
        </label>
        <select
          id="inquiry"
          name="inquiry"
          disabled={loading}
          className="mt-1 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm transition-colors disabled:opacity-60"
        >
          <option value="">Select service...</option>
          <option value="air-freight">Specialized Air Freight</option>
          <option value="customs">Shipping & Customs</option>
          <option value="warehousing">GDP Warehousing</option>
          <option value="controlled-temp">Controlled Temperature Transport</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-neutral-700"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          disabled={loading}
          className="mt-1 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm transition-colors disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--color-accent-ref)", boxShadow: "0 4px 14px rgba(91,191,33,0.3)" }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Submit Request"
        )}
      </button>
    </form>
  );
}
