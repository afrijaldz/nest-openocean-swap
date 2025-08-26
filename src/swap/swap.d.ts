export interface SwapRequest {
  usdtAmount: string;
}

export interface SwapQuoteResponse {
  data: {
    inToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    outToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    inAmount: string;
    outAmount: string;
    estimatedGas: string;
    to: string;
    data: string;
    value: string;
  };
  code: number;
  message: string;
}
