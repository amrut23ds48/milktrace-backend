import { calculateExpectedQuality, evaluateQualityRisk, QualityInput } from '../anomalyEngine';

describe('Anomaly Engine Math & Risk Logic', () => {
  describe('calculateExpectedQuality (Volume-Weighted Average)', () => {
    it('should correctly calculate expected Fat and SNF for a standard consolidation', () => {
      const inputs: QualityInput[] = [
        { volume: 20, fat: 6.0, snf: 9.0 },
        { volume: 30, fat: 4.0, snf: 8.5 },
      ];
      // Total Vol: 50
      // Expected Fat: ((20 * 6) + (30 * 4)) / 50 = (120 + 120) / 50 = 240 / 50 = 4.8
      // Expected SNF: ((20 * 9) + (30 * 8.5)) / 50 = (180 + 255) / 50 = 435 / 50 = 8.7

      const result = calculateExpectedQuality(inputs);
      expect(result.totalVolume).toBe(50);
      expect(result.expectedFat).toBeCloseTo(4.8, 2);
      expect(result.expectedSnf).toBeCloseTo(8.7, 2);
    });

    it('should return zeros when inputs are empty', () => {
      const result = calculateExpectedQuality([]);
      expect(result.totalVolume).toBe(0);
      expect(result.expectedFat).toBe(0);
      expect(result.expectedSnf).toBe(0);
    });

    it('should handle single collection accurately', () => {
      const inputs: QualityInput[] = [
        { volume: 100, fat: 5.5, snf: 8.8 },
      ];
      const result = calculateExpectedQuality(inputs);
      expect(result.totalVolume).toBe(100);
      expect(result.expectedFat).toBe(5.5);
      expect(result.expectedSnf).toBe(8.8);
    });

    it('should handle zero volume components correctly without breaking', () => {
      const inputs: QualityInput[] = [
        { volume: 10, fat: 6.0, snf: 9.0 },
        { volume: 0, fat: 10.0, snf: 12.0 }, // zero volume, should not impact
      ];
      const result = calculateExpectedQuality(inputs);
      expect(result.totalVolume).toBe(10);
      expect(result.expectedFat).toBe(6.0);
      expect(result.expectedSnf).toBe(9.0);
    });
  });

  describe('evaluateQualityRisk', () => {
    const expected = { totalVolume: 100, expectedFat: 4.8, expectedSnf: 8.7 };

    it('should return LOW risk if variations are well within the 0.15% threshold', () => {
      // Measured exactly same
      const result1 = evaluateQualityRisk(expected, 4.8, 8.7);
      expect(result1.riskLevel).toBe('LOW');
      expect(result1.riskScore).toBe(0);

      // Measured slightly off but within +/- 0.15
      const result2 = evaluateQualityRisk(expected, 4.7, 8.8);
      expect(result2.riskLevel).toBe('LOW');
      expect(result2.riskScore).toBeLessThan(30);
    });

    it('should return MEDIUM risk for minor threshold breaches on one parameter', () => {
      // Fat drops by 0.3 (threshold is 0.15)
      const result = evaluateQualityRisk(expected, 4.5, 8.7);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
      expect(result.riskScore).toBeLessThan(60);
      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.flags[0]).toContain('Fat');
    });

    it('should return HIGH risk if both parameters drop beyond the threshold significantly', () => {
      // Both drop by 0.3 (total 60 points)
      const result = evaluateQualityRisk(expected, 4.5, 8.4);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.riskScore).toBeLessThan(80);
      expect(result.flags.length).toBe(2);
    });

    it('should return CRITICAL risk for massive deviations', () => {
      // Drop by > 1.0% (huge adulteration)
      const result = evaluateQualityRisk(expected, 3.0, 7.0);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.riskScore).toBeGreaterThanOrEqual(80);
    });
  });
});
