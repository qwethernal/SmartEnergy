import { savingsVsFixedTariff } from './savings.vs-fixed';

describe('savingsVsFixedTariff', () => {
  it('computes positive savings when spot is cheaper', () => {
    const r = savingsVsFixedTariff({
      energyKwh: 100,
      averageSpotEurPerKwh: 0.1,
      fixedTariffEurPerKwh: 0.15,
    });
    expect(r.spotCostEur).toBe(10);
    expect(r.fixedBaselineCostEur).toBe(15);
    expect(r.savingsEur).toBe(5);
    expect(r.savingsPercentVsFixed).toBeCloseTo(33.33, 1);
  });

  it('throws on negative energy', () => {
    expect(() =>
      savingsVsFixedTariff({
        energyKwh: -1,
        averageSpotEurPerKwh: 0.1,
        fixedTariffEurPerKwh: 0.15,
      }),
    ).toThrow(RangeError);
  });
});
