// Mock quote payloads for UI preview only (?preview=<variant>).
// Mirrors the exact shape the CRM /api/leads/intake returns so the preview
// renders identically to production — but with NO network call and NO lead
// created. Never used in the real submit path.

import type { Quote } from "./quoteScreen";

const VEHICLE = "Coupe / Hatchback"; // Book-now prefill target for all mocks

export const PREVIEW_VARIANTS: { key: string; label: string }[] = [
  { key: "detail", label: "Full detail" },
  { key: "interior", label: "Interior" },
  { key: "exterior", label: "Exterior" },
  { key: "ceramic", label: "Ceramic (3 cards)" },
  { key: "correction", label: "Paint correction" },
];

export const MOCK_QUOTES: Record<string, Quote> = {
  detail: {
    template_key: "inside_out",
    size: "Small",
    booking_vehicle_type: VEHICLE,
    packages: [
      {
        name: "Deluxe Detail",
        price: 355,
        price_label: "$355 + GST",
        duration: "approx. 3.5-4 hours",
        highlights: [
          "Exterior hand wash & dry",
          "Wheels, barrels & tires cleaned",
          "Interior vacuum + plastics detailed",
          "3-month paint sealant",
        ],
        booking_service_id: "deluxe-detail",
      },
      {
        name: "Premium Detail",
        price: 600,
        price_label: "$600 + GST",
        duration: "approx. 5.5-6.5 hours",
        highlights: [
          "Everything in Deluxe, plus:",
          "Full interior shampoo",
          "Clay bar decontamination",
          "Engine bay clean + 6-month sealant",
        ],
        booking_service_id: "premium-detail",
      },
    ],
  },
  interior: {
    template_key: "interior_only",
    size: "Small",
    booking_vehicle_type: VEHICLE,
    packages: [
      {
        name: "Deluxe Interior",
        price: 242,
        price_label: "$242 + GST",
        duration: "approx. 2.5-3 hours",
        highlights: [
          "Full interior vacuum",
          "Crevice detail all surfaces",
          "Plastics cleaned & protected",
          "Door jambs + interior windows",
        ],
        booking_service_id: "deluxe-interior",
      },
      {
        name: "Premium Interior",
        price: 379,
        price_label: "$379 + GST",
        duration: "approx. 3.5-4.5 hours",
        highlights: [
          "Everything in Deluxe, plus:",
          "Shampoo & extraction of seats, carpets, mats",
          "Double vacuum & stain extraction",
          "Interior deodorising",
        ],
        booking_service_id: "premium-interior",
      },
    ],
  },
  exterior: {
    template_key: "exterior_only",
    size: "Small",
    booking_vehicle_type: VEHICLE,
    packages: [
      {
        name: "Deluxe Exterior",
        price: 105,
        price_label: "$105 + GST",
        duration: "approx. 1.5-2 hours",
        highlights: [
          "Exterior hand wash & dry",
          "Wheels, barrels & tires cleaned",
          "Windows & mirrors",
          "3-month wax/sealant",
        ],
        booking_service_id: "deluxe-exterior",
      },
      {
        name: "Premium Exterior",
        price: 230,
        price_label: "$230 + GST",
        duration: "approx. 2.5-3 hours",
        highlights: [
          "Everything in Deluxe, plus:",
          "Clay bar treatment",
          "Full paint decontamination",
        ],
        booking_service_id: "premium-exterior",
      },
    ],
  },
  ceramic: {
    template_key: "ceramic",
    size: null,
    booking_vehicle_type: VEHICLE,
    packages: [
      {
        name: "Bronze Package",
        price: 637.5,
        price_label: "from $637.50 + GST",
        duration: "1-year protection",
        highlights: ["Gloss enhancement", "Strong hydrophobic properties"],
        booking_service_id: "ceramic-bronze",
      },
      {
        name: "Silver Package",
        price: 833,
        price_label: "from $833 + GST",
        duration: "3-year protection",
        highlights: ["Added chemical resistance", "Easy-clean surface"],
        booking_service_id: "ceramic-silver",
      },
      {
        name: "Gold Package",
        price: 1020,
        price_label: "from $1020 + GST",
        duration: "5-year protection",
        highlights: ["Backed by company warranty", "Maximum gloss retention & hardness"],
        booking_service_id: "ceramic-gold",
      },
    ],
  },
  correction: {
    template_key: "paint_correction",
    size: null,
    booking_vehicle_type: VEHICLE,
    packages: [
      {
        name: "1-Step Correction",
        price: 550,
        price_label: "from $550 + GST",
        duration: "approx. 4-5 hours",
        highlights: ["Removes up to 90% of light swirls", "Great for most daily drivers"],
        booking_service_id: "1-step-correction",
      },
      {
        name: "2-Step Correction",
        price: 900,
        price_label: "from $900 + GST",
        duration: "approx. 7-8 hours",
        highlights: ["Removes deeper scratches & watermarks", "Maximises clarity & reflection"],
        booking_service_id: "2-step-correction",
      },
    ],
  },
};
