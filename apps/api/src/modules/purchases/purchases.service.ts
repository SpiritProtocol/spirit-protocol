import type { PrismaClient } from "@prisma/client";
import type { TransactionDto } from "@spirit/shared";
import { AppError } from "../../lib/errors.js";
import { toTransactionDto } from "../../mappers.js";
import type { BlockchainService } from "../../services/blockchain/index.js";
import type { PaymentService } from "../../services/payment/index.js";
import type { ProvenanceService } from "../provenance/provenance.service.js";

/**
 * The mock purchase flow: initiate() simulates the wallet-connect step,
 * confirm() simulates the payment-confirmation step and then atomically
 * flips listing status, artwork ownership, and artwork status back to
 * VERIFIED (unlisted, so the new owner can relist later). The flip only
 * happens if the listing is still ACTIVE and the seller still owns the
 * artwork; otherwise the transaction is CANCELLED with a 409.
 */
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provenance: ProvenanceService,
    private readonly payment: PaymentService,
    private readonly blockchain: BlockchainService,
  ) {}

  async initiate(listingId: string, buyerId: string): Promise<TransactionDto> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw AppError.notFound("Listing not found");
    if (listing.status !== "ACTIVE") throw AppError.conflict("This listing is no longer available");
    if (listing.sellerId === buyerId) throw AppError.conflict("You cannot purchase your own listing");

    const paymentInit = await this.payment.initiatePayment({
      amount: Number(listing.price),
      currency: listing.currency,
      buyerId,
    });

    const tx = await this.prisma.transaction.create({
      data: {
        listingId: listing.id,
        artworkId: listing.artworkId,
        buyerId,
        sellerId: listing.sellerId,
        amount: listing.price,
        currency: listing.currency,
        status: "PENDING",
        paymentRef: paymentInit.paymentRef,
      },
      include: { buyer: true, seller: true },
    });

    return toTransactionDto(tx);
  }

  async confirm(transactionId: string, buyerId: string): Promise<TransactionDto> {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw AppError.notFound("Transaction not found");
    if (tx.buyerId !== buyerId) throw AppError.forbidden("This is not your transaction");
    if (tx.status !== "PENDING") throw AppError.conflict("This transaction has already been processed");

    const confirmation = await this.payment.confirmPayment({ paymentRef: tx.paymentRef! });

    if (confirmation.status !== "completed") {
      const failed = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "FAILED" },
        include: { buyer: true, seller: true },
      });
      return toTransactionDto(failed);
    }

    const chainRecord = await this.blockchain.recordOwnershipTransfer({
      artworkId: tx.artworkId,
      fromOwnerId: tx.sellerId,
      toOwnerId: tx.buyerId,
    });

    let completedTx;
    try {
      completedTx = await this.prisma.$transaction(async (db) => {
        // Re-check inside the transaction with conditional updates: between initiate() and confirm()
        // another buyer may have bought the artwork, or the seller may have cancelled the listing.
        const listingClaim = await db.listing.updateMany({
          where: { id: tx.listingId, status: "ACTIVE" },
          data: { status: "SOLD" },
        });
        if (listingClaim.count === 0) throw AppError.conflict("This listing is no longer available");

        const ownerSwap = await db.artwork.updateMany({
          where: { id: tx.artworkId, currentOwnerId: tx.sellerId },
          data: { status: "VERIFIED", currentOwnerId: tx.buyerId },
        });
        if (ownerSwap.count === 0) throw AppError.conflict("The seller no longer owns this artwork");

        return db.transaction.update({
          where: { id: transactionId, status: "PENDING" },
          data: { status: "COMPLETED", blockchainRef: chainRecord.txHash, completedAt: new Date() },
          include: { buyer: true, seller: true },
        });
      });
    } catch (error) {
      if (error instanceof AppError) {
        // The sale can no longer happen; don't leave the buyer's transaction pending forever.
        await this.prisma.transaction.updateMany({
          where: { id: transactionId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      throw error;
    }

    await this.provenance.record({
      artworkId: tx.artworkId,
      type: "SOLD",
      fromOwnerId: tx.sellerId,
      toOwnerId: tx.buyerId,
      actorId: tx.buyerId,
      listingId: tx.listingId,
      transactionId: tx.id,
      metadata: {
        amount: Number(tx.amount),
        currency: tx.currency,
        blockchainRef: chainRecord.txHash,
        blockNumber: chainRecord.blockNumber,
      },
    });

    return toTransactionDto(completedTx);
  }

  async listForUser(userId: string): Promise<TransactionDto[]> {
    const txs = await this.prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: { buyer: true, seller: true },
      orderBy: { createdAt: "desc" },
    });
    return txs.map(toTransactionDto);
  }

  async listAll(): Promise<TransactionDto[]> {
    const txs = await this.prisma.transaction.findMany({
      include: { buyer: true, seller: true },
      orderBy: { createdAt: "desc" },
    });
    return txs.map(toTransactionDto);
  }
}
