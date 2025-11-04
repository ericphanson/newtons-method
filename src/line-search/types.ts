export interface LineSearchResult {
  alpha: number;
  newLoss: number;
  trials: Array<{
    trial: number;
    alpha: number;
    loss: number;
    armijoRHS: number;
    satisfied: boolean;
  }>;
  curve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

export type ComputeLossAndGrad = (w: number[]) => { loss: number; grad: number[] };
