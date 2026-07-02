import { useState } from "react";
import { buildQuoteHtml, type Quote } from "./quoteScreen";

// Read ?shop=wellington from the iframe URL, falling back to env / default.
// Single deployment serves every shop — embed pages set the param on the
// iframe src.
const urlParams =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

const SHOP_SLUG =
  urlParams.get("shop") || import.meta.env.VITE_SHOP_SLUG || "christchurch";

// Google Ads attribution. The host page (cleancarcollective.co.nz) captures
// gclid/gbraid/wbraid into a cookie when an ad sends the user to the site.
// That cookie isn't visible from this iframe (different origin), so the host
// page passes attribution through to the iframe via URL query params on the
// iframe src. We read them here and forward to the CRM with each lead.
const ATTRIBUTION = {
  gclid: urlParams.get("gclid") || undefined,
  gbraid: urlParams.get("gbraid") || undefined,
  wbraid: urlParams.get("wbraid") || undefined,
  landing_url: urlParams.get("landing_url") || undefined,
};

const CRM_LEAD_URL =
  import.meta.env.VITE_CRM_LEAD_URL ||
  "https://crm.cleancarcollective.co.nz/api/leads/intake";

// Per-shop thank-you destinations. Add new rows here when a shop comes online.
// VITE_THANK_YOU_URL is only used when the shop isn't in this map (one-off
// staging / new shop you haven't added to code yet).
const THANK_YOU_URLS: Record<string, string> = {
  christchurch:
    "https://cleancarcollective.co.nz/christchurch-quote-confirmed/",
  wellington:
    "https://cleancarcollective.co.nz/get-in-touch/",
};

const THANK_YOU_URL =
  THANK_YOU_URLS[SHOP_SLUG] ||
  import.meta.env.VITE_THANK_YOU_URL ||
  THANK_YOU_URLS.christchurch;

// Booking pages (WP pages embedding the booking apps). The instant-quote
// Book Now buttons navigate the TOP window here with service/vehicle
// params; the booking apps read them from document.referrer for prefill.
const BOOKING_URLS: Record<string, string> = {
  christchurch: "https://cleancarcollective.co.nz/christchurch-make-a-booking/",
  wellington: "https://cleancarcollective.co.nz/make-a-booking/",
};

const BOOKING_URL = BOOKING_URLS[SHOP_SLUG] || BOOKING_URLS.christchurch;

// Contact details for the quote screen's "get in touch" block. The 0800
// line is national, so both shops use it.
const SHOP_PHONE: Record<string, { display: string; tel: string }> = {
  christchurch: { display: "0800 476 667", tel: "0800476667" },
  wellington: { display: "0800 476 667", tel: "0800476667" },
};
const CONTACT = {
  phone: SHOP_PHONE[SHOP_SLUG] || SHOP_PHONE.christchurch,
  email: "hello@cleancarcollective.co.nz",
};

const SERVICES = [
  "Inside and out package options",
  "Interior only",
  "Exterior only",
  "Ceramic coating",
  "Paint correction",
  "Paint protection film",
  "Other",
];

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  vehicle: string;
  service_requested: string;
  notes: string;
};

const EMPTY: FormState = {
  full_name: "",
  email: "",
  phone: "",
  vehicle: "",
  service_requested: "",
  notes: "",
};

type Status = "idle" | "submitting" | "error" | "quote";

export default function App() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const nameParts = form.full_name.trim().split(/\s+/);
    const first_name = nameParts[0] ?? form.full_name;
    const last_name = nameParts.slice(1).join(" ") || undefined;

    try {
      const response = await fetch(CRM_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          email: form.email,
          phone: form.phone || undefined,
          vehicle_make: form.vehicle || undefined,
          service_requested: form.service_requested || undefined,
          notes: form.notes || undefined,
          shop_slug: SHOP_SLUG,
          source: "website-lead-form",
          ...ATTRIBUTION,
        }),
      });

      if (!response.ok) throw new Error("Submission failed. Please try again.");

      // Instant on-page quote: when the CRM's auto-send gate passes it
      // returns the same packages+prices the estimate email contains.
      // Any escalated lead (notes needing a human, unknown vehicle size)
      // gets quote:null and follows the existing thank-you redirect —
      // the team emails them manually exactly as before.
      try {
        const data = await response.json();
        if (data?.quote?.packages?.length) {
          setQuote(data.quote as Quote);
          setStatus("quote");
          window.scrollTo({ top: 0 });
          return;
        }
      } catch {
        // Body parse failure — fall through to the redirect.
      }

      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = THANK_YOU_URL;
          return;
        }
      } catch {
        // Fall back to same-frame navigation if the embed context blocks top access.
      }

      window.location.href = THANK_YOU_URL;
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  // Book-now buttons live inside the designed HTML (rendered via
  // dangerouslySetInnerHTML), so wire them with one delegated click handler
  // that reads the service id off the clicked button and deep-links the
  // booking page with the package + vehicle pre-filled.
  function handleQuoteClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-book-service]");
    if (!el) return;
    e.preventDefault();
    const serviceId = el.getAttribute("data-book-service");
    if (!serviceId) return;
    const params = new URLSearchParams();
    params.set("service", serviceId);
    if (quote?.booking_vehicle_type) params.set("vehicle", quote.booking_vehicle_type);
    const url = `${BOOKING_URL}?${params.toString()}`;
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
        return;
      }
    } catch {
      // Embed context blocks top access — same-frame fallback below.
    }
    window.location.href = url;
  }

  const isSubmitting = status === "submitting";

  if (status === "quote" && quote) {
    return (
      <div
        onClick={handleQuoteClick}
        dangerouslySetInnerHTML={{
          __html: buildQuoteHtml(quote, form.vehicle, CONTACT),
        }}
      />
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>Free Estimate</h2>

        <form onSubmit={handleSubmit} noValidate style={s.form}>

          <Field label="First & last name" required>
            <input
              name="full_name"
              type="text"
              required
              autoComplete="name"
              placeholder=""
              value={form.full_name}
              onChange={handleChange}
              style={s.input}
            />
          </Field>

          <Field label="Email" required>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder=""
              value={form.email}
              onChange={handleChange}
              style={s.input}
            />
          </Field>

          <Field label="Phone number" required>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder=""
              value={form.phone}
              onChange={handleChange}
              style={s.input}
            />
          </Field>

          <div style={s.divider} />

          <Field label="Service Enquiry" required>
            <div style={s.selectWrap}>
              <select
                name="service_requested"
                required
                value={form.service_requested}
                onChange={handleChange}
                style={s.select}
              >
                <option value="">Select one...</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={s.chevron}>›</span>
            </div>
          </Field>

          <p style={s.hint}>Vehicle (e.g. 2018 Mazda CX-5, 2012 BMW 125i)</p>

          <Field label="Vehicle Year/Make/Model" required>
            <input
              name="vehicle"
              type="text"
              required
              placeholder=""
              value={form.vehicle}
              onChange={handleChange}
              style={s.input}
            />
          </Field>

          <Field label="Any additional information?">
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              style={{ ...s.input, resize: "vertical", minHeight: "80px", lineHeight: "1.5" }}
            />
          </Field>

          {status === "error" && (
            <p style={s.error}>{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...s.button, ...(isSubmitting ? s.buttonDisabled : {}) }}
          >
            {isSubmitting ? "Sending…" : "Get Free Estimate!"}
          </button>

        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.label}>
        {label}{required && <span style={s.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: "32px 24px 40px",
    boxSizing: "border-box",
  },
  title: {
    margin: "0 0 24px",
    fontSize: "26px",
    fontWeight: 700,
    color: "#0a0a0a",
    letterSpacing: "-0.01em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0a0a0a",
  },
  required: {
    color: "#0a0a0a",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#0a0a0a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #d0d0d0",
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  selectWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#0a0a0a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #d0d0d0",
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    appearance: "none",
    cursor: "pointer",
    paddingRight: "36px",
  },
  chevron: {
    position: "absolute",
    right: "14px",
    fontSize: "18px",
    color: "#666",
    pointerEvents: "none",
    transform: "rotate(90deg)",
    lineHeight: 1,
  },
  divider: {
    borderTop: "1.5px solid #0a0a0a",
    margin: "4px 0",
  },
  hint: {
    margin: "-4px 0 -4px",
    fontSize: "13px",
    color: "#666666",
  },
  error: {
    margin: 0,
    fontSize: "14px",
    color: "#c0392b",
  },
  button: {
    width: "fit-content",
    padding: "13px 24px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#0a0a0a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "4px",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  quoteIntro: {
    margin: "-12px 0 20px",
    fontSize: "14px",
    color: "#555555",
    lineHeight: 1.5,
  },
  quoteList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  quoteCard: {
    border: "1.5px solid #d0d0d0",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  quoteCardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  quoteName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#0a0a0a",
  },
  quoteDuration: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#777777",
  },
  quotePrice: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#0a0a0a",
    whiteSpace: "nowrap",
  },
  quoteHighlights: {
    margin: 0,
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  quoteHighlight: {
    fontSize: "13px",
    color: "#444444",
    lineHeight: 1.45,
  },
  quoteFootnote: {
    margin: "18px 0 0",
    fontSize: "12px",
    color: "#777777",
    lineHeight: 1.5,
  },
};
