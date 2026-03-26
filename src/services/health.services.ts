import { healthRepository } from "../repository/health.repository.js";

export const healthService = {
  getHealthStatus: async () => {
    return healthRepository.getHealthStatus();
  },
};
