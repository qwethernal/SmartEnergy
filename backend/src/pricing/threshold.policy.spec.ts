import { shouldAutoTurnOff, shouldAutoTurnOn } from './threshold.policy';

describe('threshold.policy', () => {
  it('does not act when manual override', () => {
    expect(
      shouldAutoTurnOff({
        priceEurMwh: 500,
        thresholdEurMwh: 100,
        manualOverride: true,
        automationEnabled: true,
      }),
    ).toBe(false);
  });

  it('turns off when price above threshold', () => {
    expect(
      shouldAutoTurnOff({
        priceEurMwh: 200,
        thresholdEurMwh: 150,
        manualOverride: false,
        automationEnabled: true,
      }),
    ).toBe(true);
  });

  it('handles negative price without throwing', () => {
    expect(
      shouldAutoTurnOff({
        priceEurMwh: -10,
        thresholdEurMwh: 5,
        manualOverride: false,
        automationEnabled: true,
      }),
    ).toBe(false);
  });

  it('turns on when price back at or below threshold', () => {
    expect(
      shouldAutoTurnOn({
        priceEurMwh: 100,
        thresholdEurMwh: 120,
        manualOverride: false,
        automationEnabled: true,
      }),
    ).toBe(true);
  });
});
