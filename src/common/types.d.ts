import { createWalletClient, publicActions } from 'viem';

export type ExtendedWalletClient =
  ReturnType<typeof createWalletClient> extends infer T
    ? T extends any
      ? T & ReturnType<typeof publicActions>
      : never
    : never;

export type TransactionResult = {
  transactionHash: string;
  status: 'success' | 'failed';
  gasUsed?: string;
  blockNumber?: number;
};
