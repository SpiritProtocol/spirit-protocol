import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createBlockchainService, type BlockchainService } from "../services/blockchain/index.js";
import {
  createHardwareVerificationService,
  type HardwareVerificationService,
} from "../services/hardware-verification/index.js";
import { createPaymentService, type PaymentService } from "../services/payment/index.js";

export interface Services {
  hardwareVerification: HardwareVerificationService;
  blockchain: BlockchainService;
  payment: PaymentService;
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
    } satisfies Services);
  },
  { name: "services-plugin", dependencies: ["prisma-plugin"] },
);
