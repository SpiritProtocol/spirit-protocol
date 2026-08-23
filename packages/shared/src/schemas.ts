import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const telegramAuthSchema = z.object({
  initData: z.string().min(1),
});
export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ---------------------------------------------------------------------------
// Artwork
// ---------------------------------------------------------------------------

export const createArtworkSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  year: z.number().int().min(0).max(3000).optional(),
  medium: z.string().max(200).optional(),
  dimensions: z.string().max(100).optional(),
  description: z.string().max(4000).optional(),
  value: z.number().positive(),
  images: z.array(z.string().url()).max(10).default([]),
  ownerId: z.string().uuid().optional(),
});
export type CreateArtworkInput = z.infer<typeof createArtworkSchema>;

export const updateArtworkSchema = createArtworkSchema.partial();
export type UpdateArtworkInput = z.infer<typeof updateArtworkSchema>;

export const assignOwnerSchema = z.object({
  ownerId: z.string().uuid(),
});
export type AssignOwnerInput = z.infer<typeof assignOwnerSchema>;

export const changeArtworkStatusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "LISTED", "SOLD", "ARCHIVED"]),
});
export type ChangeArtworkStatusInput = z.infer<typeof changeArtworkStatusSchema>;

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export const startVerificationSchema = z.object({
  artworkId: z.string().uuid(),
});
export type StartVerificationInput = z.infer<typeof startVerificationSchema>;

export const reviewVerificationSchema = z.object({
  notes: z.string().max(2000).optional(),
});
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

// ---------------------------------------------------------------------------
// Vault
// ---------------------------------------------------------------------------

export const updateVaultCoverageSchema = z.object({
  coveragePercent: z.number().min(0).max(100),
});
export type UpdateVaultCoverageInput = z.infer<typeof updateVaultCoverageSchema>;

// ---------------------------------------------------------------------------
// Listings & purchases
// ---------------------------------------------------------------------------

export const createListingSchema = z.object({
  artworkId: z.string().uuid(),
  price: z.number().positive(),
  currency: z.string().length(3).default("USD"),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z.object({
  price: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
});
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const initiatePurchaseSchema = z.object({
  listingId: z.string().uuid(),
});
export type InitiatePurchaseInput = z.infer<typeof initiatePurchaseSchema>;

export const confirmPurchaseSchema = z.object({
  transactionId: z.string().uuid(),
});
export type ConfirmPurchaseInput = z.infer<typeof confirmPurchaseSchema>;

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

export const seedDemoSchema = z.object({
  dataset: z.string().default("investor-demo"),
});
export type SeedDemoInput = z.infer<typeof seedDemoSchema>;
