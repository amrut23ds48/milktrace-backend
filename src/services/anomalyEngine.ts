export interface QualityInput {
  volume: number;
  fat: number;
  snf: number;
}

export interface ExpectedQuality {
  expectedFat: number;
  expectedSnf: number;
  totalVolume: number;
}

export const FAT_TOLERANCE_THRESHOLD = 0.15;
export const SNF_TOLERANCE_THRESHOLD = 0.15;

/**
 * Calculates the Volume-Weighted Average for Expected Fat and SNF.
 */
export function calculateExpectedQuality(inputs: QualityInput[]): ExpectedQuality {
  if (!inputs || inputs.length === 0) {
    return { expectedFat: 0, expectedSnf: 0, totalVolume: 0 };
  }

  let totalVolume = 0;
  let totalFatMass = 0;
  let totalSnfMass = 0;

  for (const input of inputs) {
    if (input.volume > 0) {
      totalVolume += input.volume;
      totalFatMass += input.volume * input.fat;
      totalSnfMass += input.volume * input.snf;
    }
  }

  if (totalVolume === 0) {
    return { expectedFat: 0, expectedSnf: 0, totalVolume: 0 };
  }

  return {
    expectedFat: totalFatMass / totalVolume,
    expectedSnf: totalSnfMass / totalVolume,
    totalVolume,
  };
}

/**
 * Evaluates the risk score based on deviation from expected values.
 * Uses a linear mapping approach for the prototype:
 * 1 point for every 0.01% deviation above the threshold.
 */
export function evaluateQualityRisk(
  expected: ExpectedQuality,
  measuredFat: number,
  measuredSnf: number
): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; flags: string[] } {
  
  let riskScore = 0;
  const flags: string[] = [];

  const fatDiff = expected.expectedFat - measuredFat; // Positive means measured is lower than expected (worse)
  const snfDiff = expected.expectedSnf - measuredSnf;

  if (fatDiff > FAT_TOLERANCE_THRESHOLD) {
    const penalty = Math.round((fatDiff - FAT_TOLERANCE_THRESHOLD) * 100);
    riskScore += penalty * 2; // Weight Fat heavily
    flags.push(`Fat dropped by ${fatDiff.toFixed(2)}% (Threshold: ${FAT_TOLERANCE_THRESHOLD}%)`);
  }

  if (snfDiff > SNF_TOLERANCE_THRESHOLD) {
    const penalty = Math.round((snfDiff - SNF_TOLERANCE_THRESHOLD) * 100);
    riskScore += penalty * 2; // Weight SNF heavily
    flags.push(`SNF dropped by ${snfDiff.toFixed(2)}% (Threshold: ${SNF_TOLERANCE_THRESHOLD}%)`);
  }

  // Cap score at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 80) {
    riskLevel = 'CRITICAL';
  } else if (riskScore >= 60) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 30) {
    riskLevel = 'MEDIUM';
  } else {
    // If we have flags but score < 30, ensure it's at least LOW with 0 score
    if (riskScore === 0 && flags.length > 0) {
      riskScore = 10; 
      // Force medium if there are actual flags but the score formula didn't yield much
    }
  }

  return { riskScore, riskLevel, flags };
}
