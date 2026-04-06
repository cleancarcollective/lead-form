import { useState } from "react";

const CRM_LEAD_URL =
  import.meta.env.VITE_CRM_LEAD_URL || "https://crm-tawny-nine-13.vercel.app/api/leads/intake";

const THANK_YOU_URL =
  import.meta.env.VITE_THANK_YOU_URL || "https://cleancarcollective.co.nz/thank-you";

const SHOP_SLUG =
  import.meta.env.VITE_SHOP_SLUG || "christchurch";

const SERVICES = [
  "Premium Detail",
  "Deluxe Detail",
  "Premium Interior",
  "Deluxe Interior",
  "Mold Treatment",
  "Deluxe Exterior Hand Wash",
  "Premium Exterior",
  "1-Step Paint Correction",
  "2-Step Paint Correction",
  "Ceramic Coating – Bronze",
  "Ceramic Coating – Silver",
  "Ceramic Coating – Gold",
  "Not sure — I'd like a recommendation",
];

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  service_requested: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  service_requested: "",
  notes: "",
};

type Status = "idle" | "submitting" | "error";

export default function App() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(CRM_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shop_slug: SHOP_SLUG,
          source: "website-lead-form",
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed. Please try again.");
      }

      window.location.href = THANK_YOU_URL;
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.headerEyebrow}>Clean Car Collective</p>
          <h1 style={styles.headerTitle}>Get a Quote</h1>
          <p style={styles.headerSubtitle}>Fill in your details and we'll get back to you shortly.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>

          {/* Name row */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="first_name">First name <span style={styles.required}>*</span></label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                autoComplete="given-name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Jane"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Smith"
                style={styles.input}
              />
            </div>
          </div>

          {/* Contact row */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">Email <span style={styles.required}>*</span></label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="021 000 0000"
                style={styles.input}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Vehicle row */}
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: "0 0 90px" }}>
              <label style={styles.label} htmlFor="vehicle_year">Year</label>
              <input
                id="vehicle_year"
                name="vehicle_year"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.vehicle_year}
                onChange={handleChange}
                placeholder="2019"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="vehicle_make">Make</label>
              <input
                id="vehicle_make"
                name="vehicle_make"
                type="text"
                value={form.vehicle_make}
                onChange={handleChange}
                placeholder="Toyota"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="vehicle_model">Model</label>
              <input
                id="vehicle_model"
                name="vehicle_model"
                type="text"
                value={form.vehicle_model}
                onChange={handleChange}
                placeholder="RAV4"
                style={styles.input}
              />
            </div>
          </div>

          {/* Service */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="service_requested">Service interested in</label>
            <select
              id="service_requested"
              name="service_requested"
              value={form.service_requested}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.select }}
            >
              <option value="">Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="notes">Anything else we should know?</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Specific concerns, stains, paint issues…"
              style={{ ...styles.input, ...styles.textarea }}
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <div style={styles.errorBox}>
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...styles.button, ...(isSubmitting ? styles.buttonDisabled : {}) }}
          >
            {isSubmitting ? "Sending…" : "Request a Quote"}
          </button>

        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Questions? Call us on{" "}
            <a href="tel:0800476667" style={styles.footerLink}>0800 476 667</a>
            {" "}or email{" "}
            <a href="mailto:hello@cleancarcollective.co.nz" style={styles.footerLink}>hello@cleancarcollective.co.nz</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0ebe4",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px 48px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: "antialiased",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "620px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
    border: "1px solid #e8e0d6",
  },
  header: {
    background: "linear-gradient(160deg, #1a1713 0%, #0d0c0b 100%)",
    padding: "32px 36px",
  },
  headerEyebrow: {
    margin: "0 0 6px",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "#a89e96",
  },
  headerTitle: {
    margin: "0 0 10px",
    fontSize: "28px",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.1,
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#7a6f68",
    lineHeight: 1.5,
  },
  form: {
    padding: "32px 36px 28px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  row: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    minWidth: "140px",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "#5c5148",
  },
  required: {
    color: "#c0392b",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "15px",
    color: "#1a1713",
    backgroundColor: "#faf8f5",
    border: "1px solid #ddd5c8",
    borderRadius: "10px",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  select: {
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%239e9189' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
    cursor: "pointer",
  },
  textarea: {
    resize: "vertical" as const,
    minHeight: "88px",
    lineHeight: 1.6,
  },
  divider: {
    borderTop: "1px solid #ede6dc",
    margin: "4px 0",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fdf2f2",
    border: "1px solid #f5c6c6",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#c0392b",
    lineHeight: 1.5,
  },
  button: {
    width: "100%",
    padding: "15px 24px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#1a1713",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    letterSpacing: "0.02em",
    marginTop: "4px",
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footer: {
    padding: "18px 36px 24px",
    borderTop: "1px solid #ede6dc",
  },
  footerText: {
    margin: 0,
    fontSize: "13px",
    color: "#9e9189",
    lineHeight: 1.6,
  },
  footerLink: {
    color: "#5c5148",
    fontWeight: 600,
    textDecoration: "none",
  },
};
