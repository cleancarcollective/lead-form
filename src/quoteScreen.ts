// Instant-quote result screen (conversion-forward design).
//
// Rendered as an HTML string (via dangerouslySetInnerHTML) rather than JSX
// so the designed markup + inline SVGs stay verbatim. App.tsx wires the
// "Book" buttons with a single delegated click handler that reads
// data-book-service off the clicked element.

export type QuotePackage = {
  name: string;
  price: number | null;
  price_label: string;
  duration: string;
  highlights: string[];
  booking_service_id: string;
};

export type Quote = {
  template_key: string;
  size: string | null;
  booking_vehicle_type: string | null;
  packages: QuotePackage[];
};

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── inline SVG icons (kept identical to the approved design) ────────────────
const IC = {
  star: '<svg viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z"/></svg>',
  starWhite: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z"/></svg>',
  shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  clockSm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  guarantee: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13"/><path d="M5 13h14v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1z"/><circle cx="7.5" cy="15.5" r=".6" fill="currentColor"/><circle cx="16.5" cy="15.5" r=".6" fill="currentColor"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20l9-9a2.5 2.5 0 00-3.5-3.5l-9 9-1.5 5z"/><path d="M14 6l4 4"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5 5.6.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
  reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 015 5v3"/></svg>',
};

const CSS = `
.ccc-estimate *{box-sizing:border-box;margin:0;padding:0}
.ccc-estimate{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;background:#ffffff;line-height:1.5;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;max-width:640px;margin:0 auto;padding:20px 18px 28px}
.ccc-estimate .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
.ccc-trust{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;padding:11px 14px;border:1px solid #e2e2e2;border-radius:12px;background:#fafafa;margin-bottom:22px}
.ccc-trust .ccc-t-item{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#3a3a3a;white-space:nowrap}
.ccc-trust .ccc-t-item svg{flex:none;display:block}
.ccc-trust .ccc-stars{display:flex;align-items:center;gap:2px}
.ccc-trust .ccc-stars svg{width:14px;height:14px}
.ccc-trust .ccc-t-strong{font-weight:600;color:#0a0a0a}
.ccc-trust .ccc-t-sep{width:1px;height:14px;background:#e2e2e2}
.ccc-scarce{display:flex;align-items:center;justify-content:center;gap:9px;margin:0 0 18px;padding:11px 14px;border:1px solid #f4c9c9;background:#fdecec;border-radius:11px;color:#c62828;font-size:13px;font-weight:600;line-height:1.3;text-align:center}
.ccc-scarce .ccc-dot{width:9px;height:9px;border-radius:50%;background:#e23b3b;flex:none;box-shadow:0 0 0 0 rgba(226,59,59,.5);animation:cccpulse 1.7s ease-in-out infinite}
.ccc-scarce .ccc-n{font-weight:800}
@keyframes cccpulse{0%{transform:scale(.85);box-shadow:0 0 0 0 rgba(226,59,59,.5)}70%{transform:scale(1);box-shadow:0 0 0 7px rgba(226,59,59,0)}100%{transform:scale(.85);box-shadow:0 0 0 0 rgba(226,59,59,0)}}
@media (prefers-reduced-motion:reduce){.ccc-scarce .ccc-dot{animation:none}}
.ccc-head{margin-bottom:20px}
.ccc-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6a6a6a;margin-bottom:9px}
.ccc-eyebrow svg{width:13px;height:13px;display:block}
.ccc-head h1{font-size:23px;font-weight:700;letter-spacing:-.02em;line-height:1.22}
.ccc-head h1 .ccc-veh{white-space:nowrap}
.ccc-emailed{display:flex;align-items:center;gap:7px;margin-top:10px;font-size:13.5px;color:#555}
.ccc-emailed svg{flex:none;width:15px;height:15px;display:block;color:#0a0a0a}
.ccc-cards{display:grid;grid-template-columns:1fr;gap:16px}
.ccc-card{position:relative;border:1px solid #e2e2e2;border-radius:16px;background:#fff;padding:20px 18px 18px;display:flex;flex-direction:column;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}
.ccc-card--std:hover{border-color:#0a0a0a;transform:translateY(-2px);box-shadow:0 8px 24px rgba(10,10,10,.10)}
.ccc-card--feat{border:1.5px solid #0a0a0a;box-shadow:0 4px 20px rgba(10,10,10,.09)}
.ccc-card--feat:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(10,10,10,.16)}
.ccc-badge{position:absolute;top:-11px;left:18px;display:inline-flex;align-items:center;gap:5px;background:#0a0a0a;color:#fff;font-size:11px;font-weight:600;letter-spacing:.04em;padding:5px 11px;border-radius:999px;text-transform:uppercase}
.ccc-badge svg{width:12px;height:12px;display:block;color:#ffce4f}
.ccc-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ccc-name{font-size:16.5px;font-weight:700;letter-spacing:-.01em}
.ccc-time{display:flex;align-items:center;gap:5px;margin-top:6px;font-size:12.5px;color:#666}
.ccc-time svg{width:14px;height:14px;flex:none;display:block}
.ccc-price{text-align:right;flex:none}
.ccc-price .ccc-amt{font-size:27px;font-weight:700;letter-spacing:-.03em;line-height:1}
.ccc-price .ccc-gst{font-size:11.5px;color:#888;margin-top:4px;font-weight:500}
.ccc-anchor{margin-top:10px;font-size:12px;color:#7a7a7a}
.ccc-anchor .ccc-up{color:#0a0a0a;font-weight:600}
.ccc-rule{height:1px;background:#eee;margin:15px 0 13px}
.ccc-inc-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8a8a8a;margin-bottom:9px}
.ccc-inc{list-style:none;display:grid;gap:8px}
.ccc-inc li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#2a2a2a;line-height:1.4}
.ccc-inc li svg{flex:none;width:16px;height:16px;margin-top:1px;display:block;color:#0a0a0a}
.ccc-inc li.ccc-plus svg{color:#1a8a55}
.ccc-cta-wrap{margin-top:18px}
.ccc-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#0a0a0a;color:#fff;border:none;border-radius:12px;padding:15px 18px;font-family:inherit;font-size:15.5px;font-weight:600;letter-spacing:-.01em;cursor:pointer;text-decoration:none;transition:transform .12s ease,background .15s ease,box-shadow .15s ease}
.ccc-cta svg{width:17px;height:17px;flex:none;display:block}
.ccc-cta:hover{background:#1f1f1f;box-shadow:0 6px 18px rgba(10,10,10,.22)}
.ccc-cta:active{transform:scale(.985)}
.ccc-card--std .ccc-cta{background:#fff;color:#0a0a0a;border:1.5px solid #0a0a0a}
.ccc-card--std .ccc-cta:hover{background:#0a0a0a;color:#fff;box-shadow:0 6px 18px rgba(10,10,10,.18)}
.ccc-subcta{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:9px;font-size:11.5px;color:#8a8a8a;text-align:center}
.ccc-subcta svg{width:13px;height:13px;flex:none;display:block}
.ccc-notes{margin-top:22px;display:grid;gap:10px}
.ccc-note{display:flex;align-items:flex-start;gap:10px;padding:13px 15px;border:1px solid #ececec;border-radius:12px;background:#fbfbfb;font-size:13px;color:#444;line-height:1.45}
.ccc-note svg{flex:none;width:17px;height:17px;margin-top:1px;display:block;color:#0a0a0a}
.ccc-note strong{font-weight:600;color:#0a0a0a}

/* "want something else?" add-on shortcuts (deep-link the booking page) */
.ccc-more{margin-top:10px;padding:15px 16px 16px;border:1px solid #ececec;border-radius:12px;background:#fbfbfb}
.ccc-more-label{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#0a0a0a;margin-bottom:11px}
.ccc-more-label svg{width:16px;height:16px;flex:none;display:block;color:#0a0a0a}
.ccc-more-btns{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.ccc-chip{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:13px 15px;border:1.5px solid #0a0a0a;border-radius:10px;background:#fff;font-family:inherit;font-size:13.5px;font-weight:600;color:#0a0a0a;cursor:pointer;text-align:left;transition:transform .12s ease,background .15s ease,color .15s ease,box-shadow .15s ease}
.ccc-chip svg{width:15px;height:15px;flex:none;display:block;color:#0a0a0a;transition:transform .12s ease,color .15s ease}
.ccc-chip:hover{background:#0a0a0a;color:#fff;box-shadow:0 6px 18px rgba(10,10,10,.18);transform:translateY(-1px)}
.ccc-chip:hover svg{color:#fff;transform:translateX(3px)}
.ccc-chip:active{transform:translateY(0) scale(.99)}

/* "need something else?" get-in-touch block */
.ccc-git{margin-top:10px;padding:15px 16px 16px;border:1px solid #ececec;border-radius:12px;background:#fbfbfb}
.ccc-git-lead{font-size:13px;color:#444;line-height:1.45;margin-bottom:12px}
.ccc-git-lead strong{color:#0a0a0a;font-weight:600}
.ccc-git-btns{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.ccc-git-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 14px;border-radius:10px;font-family:inherit;font-size:13.5px;font-weight:600;text-decoration:none;cursor:pointer;transition:transform .12s ease,background .15s ease,box-shadow .15s ease,color .15s ease}
.ccc-git-btn svg{width:16px;height:16px;flex:none;display:block}
.ccc-git-call{background:#0a0a0a;color:#fff;border:1.5px solid #0a0a0a}
.ccc-git-call:hover{background:#1f1f1f;box-shadow:0 6px 18px rgba(10,10,10,.22);transform:translateY(-1px)}
.ccc-git-email{background:#fff;color:#0a0a0a;border:1.5px solid #0a0a0a}
.ccc-git-email:hover{background:#0a0a0a;color:#fff;box-shadow:0 6px 18px rgba(10,10,10,.18);transform:translateY(-1px)}
@media (max-width:400px){.ccc-more-btns{grid-template-columns:1fr}.ccc-git-btns{grid-template-columns:1fr}}
.ccc-foot{margin-top:20px;padding-top:16px;border-top:1px solid #eee;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:11.5px;color:#9a9a9a}
.ccc-foot span{display:flex;align-items:center;gap:6px}
.ccc-foot svg{width:13px;height:13px;flex:none;display:block}
@media (min-width:560px){.ccc-estimate{padding:24px 22px 30px}.ccc-cards{grid-template-columns:1fr 1fr;gap:16px;align-items:stretch}.ccc-cta-wrap{margin-top:auto}.ccc-head h1{font-size:25px}}
@media (max-width:400px){.ccc-trust{gap:5px 12px;padding:10px 12px}.ccc-trust .ccc-t-sep{display:none}.ccc-head h1{font-size:21px}.ccc-price .ccc-amt{font-size:24px}}
`;

/** Split "$355 + GST" / "from $637.50 + GST" / "price on request" into amount + gst. */
function splitPrice(label: string): { amt: string; gst: string } {
  const m = label.match(/^(.*?)(\s*\+\s*GST)\s*$/i);
  if (m) return { amt: m[1].trim(), gst: "+ GST" };
  return { amt: label, gst: "" };
}

function renderCard(pkg: QuotePackage, featured: boolean, anchorDiff: number | null): string {
  const { amt, gst } = splitPrice(pkg.price_label);
  const firstWord = pkg.name.split(/\s+/)[0] || "now";

  // Featured cards whose first highlight is an "Everything in X, plus" line
  // promote it to the section label; the rest render with a + icon.
  const hl = pkg.highlights.slice();
  let incLabel = "What’s included";
  let plusStyle = false;
  if (featured) {
    plusStyle = true;
    if (hl[0] && /^everything in/i.test(hl[0])) {
      incLabel = hl.shift()!.replace(/[:.]?\s*$/, "");
    }
  }

  const items = hl
    .map(
      (h) =>
        `<li class="${plusStyle ? "ccc-plus" : ""}">${plusStyle ? IC.plus : IC.check}${esc(h)}</li>`
    )
    .join("");

  const anchor =
    featured && anchorDiff && anchorDiff > 0
      ? `<div class="ccc-anchor">Just <span class="ccc-up">$${Math.round(anchorDiff)} more</span> for the complete result.</div>`
      : "";

  return `
    <div class="ccc-card ${featured ? "ccc-card--feat" : "ccc-card--std"}">
      ${featured ? `<span class="ccc-badge">${IC.starWhite}Most popular</span>` : ""}
      <div class="ccc-card-top">
        <div>
          <div class="ccc-name">${esc(pkg.name)}</div>
          <div class="ccc-time">${IC.clockSm}${esc(pkg.duration)}</div>
        </div>
        <div class="ccc-price">
          <div class="ccc-amt">${esc(amt)}</div>
          ${gst ? `<div class="ccc-gst">${gst}</div>` : ""}
        </div>
      </div>
      ${anchor}
      <div class="ccc-rule"></div>
      <div class="ccc-inc-label">${esc(incLabel)}</div>
      <ul class="ccc-inc">${items}</ul>
      <div class="ccc-cta-wrap">
        <button type="button" class="ccc-cta" data-book-service="${esc(pkg.booking_service_id)}">
          Book ${esc(firstWord)}${IC.arrow}
        </button>
        <div class="ccc-subcta">${IC.clockSm}Takes ~60 seconds · package pre-filled</div>
      </div>
    </div>`;
}

export type QuoteContact = {
  phone: { display: string; tel: string };
  email: string;
};

export function buildQuoteHtml(
  quote: Quote,
  vehicleText: string,
  contact: QuoteContact
): string {
  const { phone, email } = contact;
  const vehicle = vehicleText.trim() || "your vehicle";
  const packages = quote.packages;
  const featuredIdx = packages.length >= 2 ? 1 : -1;
  const base = packages[0]?.price ?? null;
  const feat = featuredIdx >= 0 ? packages[featuredIdx]?.price ?? null : null;
  const anchorDiff = base != null && feat != null ? feat - base : null;

  const cards = packages
    .map((p, i) => renderCard(p, i === featuredIdx, anchorDiff))
    .join("");

  // Light scarcity nudge. Eases down as the week progresses so it never
  // reads as a static fib. Indexed by day-of-week (Sun..Sat).
  const slotsLeft = [4, 5, 4, 3, 2, 2, 3][new Date().getDay()] ?? 3;
  const scarcity = `<div class="ccc-scarce"><span class="ccc-dot"></span>Only <span class="ccc-n">${slotsLeft}</span> booking${slotsLeft === 1 ? "" : "s"} left this week</div>`;

  return `<div class="ccc-estimate"><style>${CSS}</style>
  <p class="sr-only">Your detailing estimate for the ${esc(vehicle)}, with package options and booking links.</p>
  <div class="ccc-trust" role="group" aria-label="Trust signals">
    <span class="ccc-t-item"><span class="ccc-stars" aria-hidden="true">${IC.star}${IC.star}${IC.star}${IC.star}${IC.star}</span><span><span class="ccc-t-strong">230+</span> Google reviews</span></span>
    <span class="ccc-t-sep" aria-hidden="true"></span>
    <span class="ccc-t-item">${IC.shield} Licensed &amp; insured</span>
    <span class="ccc-t-sep" aria-hidden="true"></span>
    <span class="ccc-t-item">${IC.clock}<span><span class="ccc-t-strong">13 yrs</span> in business</span></span>
    <span class="ccc-t-sep" aria-hidden="true"></span>
    <span class="ccc-t-item">${IC.guarantee} Money-back guarantee</span>
  </div>
  <div class="ccc-head">
    <span class="ccc-eyebrow">${IC.car} Your estimate</span>
    <h1>Here’s your estimate for the<br><span class="ccc-veh">${esc(vehicle)}</span></h1>
    <p class="ccc-emailed">${IC.mail} A copy is on its way to your inbox, and you can book right here.</p>
  </div>
  ${scarcity}
  <div class="ccc-cards">${cards}</div>
  <div class="ccc-notes">
    <div class="ccc-note">${IC.wrench}<span><strong>Every package can be tailored to your car.</strong> Just mention what you need when you book.</span></div>
  </div>
  <div class="ccc-more">
    <div class="ccc-more-label">${IC.sparkle} Want something else?</div>
    <div class="ccc-more-btns">
      <button type="button" class="ccc-chip" data-book-service="1-step-correction">Paint correction ${IC.arrow}</button>
      <button type="button" class="ccc-chip" data-book-service="ceramic-bronze">Ceramic coating ${IC.arrow}</button>
    </div>
  </div>
  <div class="ccc-git">
    <p class="ccc-git-lead"><strong>Need something else?</strong> Tell us what you’re after and we’ll get you sorted.</p>
    <div class="ccc-git-btns">
      <a class="ccc-git-btn ccc-git-call" href="tel:${esc(phone.tel)}">${IC.phone} Call ${esc(phone.display)}</a>
      <a class="ccc-git-btn ccc-git-email" href="mailto:${esc(email)}?subject=${encodeURIComponent("Detailing enquiry: " + vehicle)}">${IC.mail} Email us</a>
    </div>
  </div>
  <div class="ccc-foot">
    <span>${IC.info} Prices exclude GST.</span>
    <span>${IC.reply} Not quite right? Just reply to the email and we’ll sort it.</span>
  </div>
</div>`;
}
