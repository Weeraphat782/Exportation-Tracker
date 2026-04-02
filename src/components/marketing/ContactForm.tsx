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
            className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 disabled:opacity-60"
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
            className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 disabled:opacity-60"
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
          className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 disabled:opacity-60"
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
          className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 disabled:opacity-60"
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
          className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-white transition enabled:hover:opacity-95 sm:w-auto disabled:opacity-60"
        style={{ backgroundColor: "var(--color-accent-ref)" }}
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
