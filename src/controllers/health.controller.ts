import type { FastifyReply, FastifyRequest } from "fastify";
import { healthService } from "../services/health.services.js";

export const healthController = {
  getHealthStatus: async (_request: FastifyRequest, _reply: FastifyReply) => {
    return healthService.getHealthStatus();
  },
};
