import { TransactionResult } from 'src/common/types.d';

export type BurnResult = TransactionResult & {
  amountBurned?: string;
  balance?: string;
};
