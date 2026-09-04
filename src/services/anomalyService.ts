import { findAnomalies, findAllAnomalies, AnomalyFilters } from '../repositories/anomalyRepository';

export async function getAnomalies(filters: AnomalyFilters = {}) {
  return findAnomalies(filters);
}

// Legacy: used by dashboardService KPI count
export async function getAllAnomalies() {
  return findAllAnomalies();
}
