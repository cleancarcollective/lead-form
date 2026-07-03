import { useState } from "react";
import { buildQuoteHtml, type Quote } from "./quoteScreen";
import { MOCK_QUOTES, PREVIEW_VARIANTS } from "./previewMocks";

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

// Layer-3 tracking: fire-and-forget funnel beacons to the CRM, keyed by
// lead_id. sendBeacon (text/plain, no preflight) survives the page
// navigation that a Book click triggers. No-ops without a lead_id (e.g.
// ?preview mode), so it never fires for mock data.
const CRM_QUOTE_EVENTS_URL =
  import.meta.env.VITE_CRM_QUOTE_EVENTS_URL ||
  "https://crm.cleancarcollective.co.nz/api/quote-events";

function sendQuoteEvent(
  leadId: string | null,
  event: string,
  meta: Record<string, unknown> = {}
) {
  if (!leadId) return;
  try {
    const body = JSON.stringify({ lead_id: leadId, event, meta, shop_slug: SHOP_SLUG });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(CRM_QUOTE_EVENTS_URL, new Blob([body], { type: "text/plain" }));
    } else {
      void fetch(CRM_QUOTE_EVENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* non-fatal */
  }
}

// UI preview mode: ?preview=<variant> renders the quote screen with mock
// data — no CRM call, no lead created. For fast design iteration only.
const PREVIEW_KEY = urlParams.get("preview");
const IS_PREVIEW = !!PREVIEW_KEY && !!MOCK_QUOTES[PREVIEW_KEY];
const PREVIEW_VEHICLE = urlParams.get("veh") || "2008 Porsche 911 Turbo S";

// Persist a shown quote in sessionStorage so it survives the customer
// clicking "Book" and hitting back (which reloads the iframe). Same-origin
// sessionStorage survives that reload within the tab; a fresh session or a
// >45min-old quote falls back to the form.
const QUOTE_STORE_KEY = `ccc_quote_${SHOP_SLUG}`;
const QUOTE_TTL_MS = 45 * 60 * 1000;

function readSavedQuote(): { quote: Quote; leadId: string | null; vehicle: string } | null {
  if (IS_PREVIEW || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QUOTE_STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as {
      ts?: number;
      quote?: Quote;
      leadId?: string | null;
      vehicle?: string;
    };
    if (!p.ts || Date.now() - p.ts > QUOTE_TTL_MS || !p.quote?.packages?.length) return null;
    return { quote: p.quote, leadId: p.leadId ?? null, vehicle: p.vehicle ?? "" };
  } catch {
    return null;
  }
}

function saveQuote(quote: Quote, leadId: string | null, vehicle: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      QUOTE_STORE_KEY,
      JSON.stringify({ ts: Date.now(), quote, leadId, vehicle })
    );
  } catch {
    /* storage blocked — non-fatal */
  }
}

const RESTORED = readSavedQuote();

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
  const [status, setStatus] = useState<Status>(
    IS_PREVIEW ? "quote" : RESTORED ? "quote" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(
    IS_PREVIEW ? MOCK_QUOTES[PREVIEW_KEY!] : RESTORED?.quote ?? null
  );
  const [leadId, setLeadId] = useState<string | null>(RESTORED?.leadId ?? null);
  // Vehicle text for the quote headline — kept separate from the live form so
  // a restored quote still shows the right vehicle after the form has reset.
  const [quoteVehicle, setQuoteVehicle] = useState<string>(RESTORED?.vehicle ?? "");

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
        const newLeadId = typeof data?.lead_id === "string" ? data.lead_id : null;
        if (newLeadId) setLeadId(newLeadId);
        if (data?.quote?.packages?.length) {
          const q = data.quote as Quote;
          setQuote(q);
          setQuoteVehicle(form.vehicle);
          setStatus("quote");
          saveQuote(q, newLeadId, form.vehicle);
          sendQuoteEvent(newLeadId, "quote_view", {
            template_key: q.template_key,
            packages: q.packages.length,
          });
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
  function navigateTop(url: string) {
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

  function handleQuoteClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;

    // Book / add-on shortcuts → deep-link the booking page with the package
    // + vehicle pre-filled, tagged src=quote so the booking is attributed
    // back to the quote screen.
    const bookEl = target.closest<HTMLElement>("[data-book-service]");
    if (bookEl) {
      e.preventDefault();
      const serviceId = bookEl.getAttribute("data-book-service");
      if (!serviceId) return;
      const kind = bookEl.getAttribute("data-book-kind") || "package";
      sendQuoteEvent(leadId, kind === "addon" ? "addon_click" : "book_click", {
        service: serviceId,
      });
      const params = new URLSearchParams();
      params.set("service", serviceId);
      if (quote?.booking_vehicle_type) params.set("vehicle", quote.booking_vehicle_type);
      params.set("src", "quote");
      navigateTop(`${BOOKING_URL}?${params.toString()}`);
      return;
    }

    // Call / Email — let the tel:/mailto: link fire natively; just log it.
    const contactEl = target.closest<HTMLElement>("[data-contact]");
    if (contactEl) {
      sendQuoteEvent(leadId, "contact_click", {
        method: contactEl.getAttribute("data-contact"),
      });
    }
  }

  const isSubmitting = status === "submitting";

  if (status === "quote" && quote) {
    const vehicleText = IS_PREVIEW ? PREVIEW_VEHICLE : quoteVehicle || form.vehicle;
    return (
      <>
        {IS_PREVIEW && <PreviewBar current={PREVIEW_KEY!} />}
        <div
          onClick={handleQuoteClick}
          dangerouslySetInnerHTML={{
            __html: buildQuoteHtml(quote, vehicleText, CONTACT),
          }}
        />
      </>
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

// Dev-only toolbar shown in ?preview mode so the quote UI can be flipped
// between package types + shops without submitting a lead.
function PreviewBar({ current }: { current: string }) {
  const link = (key: string, shop: string) =>
    `?preview=${key}&shop=${shop}&veh=${encodeURIComponent(PREVIEW_VEHICLE)}`;
  const otherShop = SHOP_SLUG === "wellington" ? "christchurch" : "wellington";
  return (
    <div style={pb.bar}>
      <span style={pb.tag}>PREVIEW · mock data, no lead created</span>
      <div style={pb.group}>
        {PREVIEW_VARIANTS.map((v) => (
          <a
            key={v.key}
            href={link(v.key, SHOP_SLUG)}
            style={{ ...pb.chip, ...(v.key === current ? pb.chipOn : null) }}
          >
            {v.label}
          </a>
        ))}
      </div>
      <a href={link(current, otherShop)} style={pb.shop}>
        shop: {SHOP_SLUG} ⟳
      </a>
    </div>
  );
}

const pb: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px 12px",
    padding: "10px 14px",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "12px",
  },
  tag: { color: "#ffce4f", fontWeight: 700, letterSpacing: "0.03em" },
  group: { display: "flex", flexWrap: "wrap", gap: "6px" },
  chip: {
    padding: "5px 11px",
    borderRadius: "999px",
    border: "1px solid #3a3a3a",
    color: "#d0d0d0",
    textDecoration: "none",
    fontWeight: 600,
  },
  chipOn: { background: "#fff", color: "#0a0a0a", borderColor: "#fff" },
  shop: {
    marginLeft: "auto",
    color: "#9a9a9a",
    textDecoration: "none",
    fontWeight: 600,
  },
};

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
