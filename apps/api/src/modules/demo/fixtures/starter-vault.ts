export interface StarterVaultArtwork {
  title: string;
  artist: string;
  year: number;
  medium: string;
  description: string;
  value: number;
  images: string[];
}

/** Granted to every new collector on first login so the Vault page is never empty for a visitor trying the demo. */
export const STARTER_VAULT_ARTWORKS: StarterVaultArtwork[] = [
  {
    title: "Lucent Fragment",
    artist: "Spirit Studio",
    year: 2024,
    medium: "Cast resin, dichroic glass",
    description: "A light-refracting fragment piece from the Lucent series, held in the Vault under standard coverage.",
    value: 12000,
    images: ["https://images.unsplash.com/photo-1578926288207-a90a5366759d?q=80&w=800&auto=format&fit=crop"],
  },
  {
    title: "Verdigris Totem",
    artist: "Spirit Studio",
    year: 2023,
    medium: "Patinated bronze, hand-carved oak base",
    description: "A totemic study in oxidized bronze, part of the Verdigris series exploring controlled decay.",
    value: 7500,
    images: ["https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=800&auto=format&fit=crop"],
  },
  {
    title: "Quiet Aperture",
    artist: "Spirit Studio",
    year: 2025,
    medium: "Anodized aluminum, hand-blown glass lens",
    description: "A minimal aperture-form sculpture referencing optical instruments, from the Aperture series.",
    value: 11000,
    images: ["https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=800&auto=format&fit=crop"],
  },
];
