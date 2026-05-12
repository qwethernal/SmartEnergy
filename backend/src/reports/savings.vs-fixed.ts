/**
 * Compares what the same energy would cost at the average spot (converted €/MWh → €/kWh)
 * versus a user-provided fixed retail tariff (€/kWh).
 *
 * Positive savingsEur means spot-side was cheaper than the fixed baseline for the same kWh.
 */
export type SavingsVsFixedInput = {
  energyKwh: number;
  /** Average spot price in €/kWh (already converted from €/MWh if needed). */
  averageSpotEurPerKwh: number;
  /** Fixed package price in €/kWh from user settings. */
  fixedTariffEurPerKwh: number;
};

export type SavingsVsFixedResult = SavingsVsFixedInput & {
  spotCostEur: number;
  fixedBaselineCostEur: number;
  savingsEur: number;
  savingsPercentVsFixed: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function savingsVsFixedTariff(
  input: SavingsVsFixedInput,
): SavingsVsFixedResult {
  if (!Number.isFinite(input.energyKwh) || input.energyKwh < 0) {
    throw new RangeError('energyKwh must be a finite non-negative number');
  }
  if (!Number.isFinite(input.averageSpotEurPerKwh)) {
    throw new RangeError('averageSpotEurPerKwh must be finite');
  }
  if (!Number.isFinite(input.fixedTariffEurPerKwh)) {
    throw new RangeError('fixedTariffEurPerKwh must be finite');
  }
  const spotCostEur = round2(input.energyKwh * input.averageSpotEurPerKwh);
  const fixedBaselineCostEur = round2(
    input.energyKwh * input.fixedTariffEurPerKwh,
  );
  const savingsEur = round2(fixedBaselineCostEur - spotCostEur);
  const savingsPercentVsFixed =
    fixedBaselineCostEur === 0
      ? 0
      : round2((savingsEur / fixedBaselineCostEur) * 100);
  return {
    ...input,
    spotCostEur,
    fixedBaselineCostEur,
    savingsEur,
    savingsPercentVsFixed,
  };
}
