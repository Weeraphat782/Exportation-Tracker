"use client";

export default function ContactForm() {
    return (
        <form
            className="mt-8 space-y-6"
            onSubmit={(e) => e.preventDefault()}
        >
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
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
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
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
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
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
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
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
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
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
                />
            </div>

            <button
                type="submit"
                className="flex w-full min-h-[44px] items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white transition sm:w-auto"
                style={{ backgroundColor: "var(--color-accent-ref)" }}
            >
                Submit Request
            </button>
        </form>
    );
}
