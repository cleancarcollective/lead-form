import { useState } from "react";

const CRM_LEAD_URL =
  import.meta.env.VITE_CRM_LEAD_URL || "https://crm-tawny-nine-13.vercel.app/api/leads/intake";

const THANK_YOU_URL =
  import.meta.env.VITE_THANK_YOU_URL || "https://cleancarcollective.co.nz/christchurch-quote-confirmed/";

const SHOP_SLUG =
  import.meta.env.VITE_SHOP_SLUG || "christchurch";

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

type Status = "idle" | "submitting" | "error";

export default function App() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
        }),
      });

      if (!response.ok) throw new Error("Submission failed. Please try again.");

      window.location.href = THANK_YOU_URL;
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  const isSubmitting = status === "submitting";

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
};
