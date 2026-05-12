export type ThresholdDecisionInput = {
  priceEurMwh: number;
  thresholdEurMwh: number | null | undefined;
  manualOverride: boolean;
  automationEnabled: boolean;
};

/**
 * When spot price exceeds a device threshold, non-overridden automation should turn the load off.
 * Negative or zero prices are treated as valid finite numbers; callers may clamp upstream.
 */
export function shouldAutoTurnOff(input: ThresholdDecisionInput): boolean {
  if (input.manualOverride || !input.automationEnabled) {
    return false;
  }
  if (input.thresholdEurMwh == null) {
    return false;
  }
  return input.priceEurMwh > input.thresholdEurMwh;
}

export function shouldAutoTurnOn(input: ThresholdDecisionInput): boolean {
  if (input.manualOverride || !input.automationEnabled) {
    return false;
  }
  if (input.thresholdEurMwh == null) {
    return false;
  }
  return input.priceEurMwh <= input.thresholdEurMwh;
}
