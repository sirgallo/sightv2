export class MathUtil {
  static calculateSMA = (values: number[]): number => {
    if (values.length < 1) throw new Error('values must be at least a series one element long')
  
    let sum = 0;
    for (const value of values) { sum += value; }
    return sum / values.length;
  };

  static calculateDev = (curr: number, mean: number): number => curr - mean;

  static calculateStd = (values: number[]): number => {
    if (values.length < 1) throw new Error('values must be at least a series one element long')
  
    const mean = MathUtil.calculateSMA(values);
    let computedSeries = 0;
  
    for (const value of values) { computedSeries += Math.pow(MathUtil.calculateDev(value, mean), 2); }
    return Math.sqrt(computedSeries / (values.length - 1));
  };

  static calculateZScore = (current: number, mean: number, std: number): number => {
    return MathUtil.calculateDev(current, mean) / std;
  };

  static calculateSlope = (emaEnd: number, emaStart: number, tEnd: number, tStart: number): number => {
    if (tEnd <= tStart) throw new Error('slope cannot have intervals equalling to 0 or with end time less than start');
    return ((emaEnd - emaStart) / (tEnd - tStart));
  };
}