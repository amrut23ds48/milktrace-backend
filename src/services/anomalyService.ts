import { findAllAnomalies } from '../repositories/anomalyRepository';

export async function getAnomalies() {
  return findAllAnomalies();
}
