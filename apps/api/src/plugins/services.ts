import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createBlockchainService, type BlockchainService } from "../services/blockchain/index.js";
import {
  createHardwareVerificationService,
  type HardwareVerificationService,
} from "../services/hardware-verification/index.js";
import { createPaymentService, type PaymentService } from "../services/payment/index.js";
import { createVaultService, type VaultService } from "../services/vault/index.js";

export interface Services {
  hardwareVerification: HardwareVerificationService;
  blockchain: BlockchainService;
  payment: PaymentService;
  vault: VaultService;
}

declare module "fastify" {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(
  async function servicesPlugin(fastify: FastifyInstance) {
    fastify.decorate("services", {
      hardwareVerification: createHardwareVerificationService(),
      blockchain: createBlockchainService(),
      payment: createPaymentService(),
      vault: createVaultService(fastify.prisma),
    } satisfies Services);
  },
  { name: "services-plugin", dependencies: ["prisma-plugin"] },
);
