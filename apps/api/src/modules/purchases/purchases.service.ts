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
 * VERIFIED (unlisted, so the new owner can relist later) — the artwork's
 * vault carries over untouched.
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

    const [completedTx] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED", blockchainRef: chainRecord.txHash, completedAt: new Date() },
        include: { buyer: true, seller: true },
      }),
      this.prisma.listing.update({ where: { id: tx.listingId }, data: { status: "SOLD" } }),
      this.prisma.artwork.update({
        where: { id: tx.artworkId },
        data: { status: "VERIFIED", currentOwnerId: tx.buyerId },
      }),
    ]);

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
