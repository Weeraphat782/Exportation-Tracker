import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
    title: "Contact Us | OMG Experience",
    description:
        "Request a quote for air freight, customs clearance, warehousing, or controlled temperature transport. OMG Experience logistics team.",
};

export default function ContactPage() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-neutral-900">Contact Us</h1>
            {/* Photo banner */}
            <div className="mt-6 aspect-[21/9] overflow-hidden rounded-xl bg-neutral-100 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"
                    alt="Contact OMG Experience Support"
                    className="h-full w-full object-cover"
                />
            </div>
            <p className="mt-6 text-neutral-600">
                Request a quote for your air freight, customs clearance, warehousing, or
                controlled temperature transport requirements. Our team will respond
                within one business day.
            </p>
            <ContactForm />
        </div>
    );
}
