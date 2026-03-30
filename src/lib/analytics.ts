/**
 * Google Tag Manager dataLayer helpers (works when GTM is loaded via NEXT_PUBLIC_GTM_ID).
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function push(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/** GA4 recommended event name for lead gen */
export function trackFormSubmit(formName: string = "contact") {
  push({
    event: "generate_lead",
    form_name: formName,
  });
}

export function trackCtaClick(label: string, location: string) {
  push({
    event: "cta_click",
    cta_label: label,
    cta_location: location,
  });
}
