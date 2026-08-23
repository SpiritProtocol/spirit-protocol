export interface DemoFixtureUser {
  username: string;
  displayName: string;
}

export const INVESTOR_DEMO_USERS: DemoFixtureUser[] = [
  { username: "sofia_marchetti", displayName: "Sofia Marchetti" },
  { username: "alex_renner", displayName: "Alex Renner" },
  { username: "spirit_studio", displayName: "Spirit Studio" },
];

export interface DemoFixtureArtwork {
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  value: number;
  images: string[];
  ownerUsername: string;
  targetStatus: "PENDING_VERIFICATION" | "VERIFIED" | "LISTED" | "SOLD";
  listPrice?: number;
  buyerUsername?: string;
}

/** Mirrors the artworks/prices/images from the visual reference prototype so the seeded demo matches it, now backed by real data. */
export const INVESTOR_DEMO_ARTWORKS: DemoFixtureArtwork[] = [
  {
    title: "Ethereal Form Vol. I",
    artist: "Spirit Studio",
    year: 2024,
    medium: "Cast resin, embedded pigment",
    description:
      "A genesis-series sculptural piece exploring translucency and suspended form. First in the Ethereal Form line.",
    value: 10000,
    images: ["https://images.unsplash.com/photo-1620641622494-9c1e2f371c94?q=80&w=800&auto=format&fit=crop"],
    ownerUsername: "sofia_marchetti",
    targetStatus: "VERIFIED",
  },
  {
    title: "Monolith Specimen",
    artist: "Spirit Studio",
    year: 2023,
    medium: "Basalt composite, brushed steel base",
    description: "A minimalist monolith study referencing geological time and material permanence.",
    value: 8000,
    images: ["https://images.unsplash.com/photo-1610375461369-d613b564f4c4?q=80&w=800&auto=format&fit=crop"],
    ownerUsername: "sofia_marchetti",
    targetStatus: "VERIFIED",
  },
  {
    title: "Chronos Capsule",
    artist: "Spirit Studio",
    year: 2024,
    medium: "Sealed glass, kinetic mechanism",
    description: "A time-capsule form encasing a slow kinetic mechanism, part of the Chronos series.",
    value: 6000,
    images: ["https://images.unsplash.com/photo-1633109741715-597b207b0b48?q=80&w=800&auto=format&fit=crop"],
    ownerUsername: "alex_renner",
    targetStatus: "LISTED",
    listPrice: 6500,
  },
  {
    title: "Fractured Halo",
    artist: "Spirit Studio",
    year: 2025,
    medium: "Blown glass, gold leaf",
    description: "A newly submitted piece awaiting verification — demonstrates the admin review queue.",
    value: 15000,
    images: ["https://images.unsplash.com/photo-1578321272176-b7bbc0679853?q=80&w=800&auto=format&fit=crop"],
    ownerUsername: "spirit_studio",
    targetStatus: "PENDING_VERIFICATION",
  },
  {
    title: "Obsidian Reliquary",
    artist: "Spirit Studio",
    year: 2022,
    medium: "Obsidian, oxidized bronze",
    description: "An early reliquary-form piece, already resold once — demonstrates a full provenance chain.",
    value: 9000,
    images: ["https://images.unsplash.com/photo-1554188248-986adbb73be4?q=80&w=800&auto=format&fit=crop"],
    ownerUsername: "alex_renner",
    targetStatus: "SOLD",
    listPrice: 9500,
    buyerUsername: "sofia_marchetti",
  },
];
