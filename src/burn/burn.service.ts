import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { idrxAbi } from 'src/common/abis/idrxAbi';
import { CHAINS, tokenAddress } from 'src/common/constants';
import { ExtendedWalletClient } from 'src/common/types';
import {
  Account,
  Address,
  createWalletClient,
  formatUnits,
  http,
  parseUnits,
  publicActions,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { BurnResult } from './burn';

@Injectable()
export class BurnService {
  private readonly logger = new Logger(BurnService.name);

  private readonly walletClient: ExtendedWalletClient;
  private readonly account: Account;

  private readonly IDRX_ADDRESS: string;

  constructor(private configService: ConfigService) {
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const rpcUrl = CHAINS.arbitrum.rpcUrls.default.http[0];

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error(
        'Invalid private key. Make sure PRIVATE_KEY is set in .env file and starts with 0x',
      );
    }

    this.account = privateKeyToAccount(privateKey as Address);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: CHAINS.arbitrum,
      transport: http(rpcUrl),
    }).extend(publicActions) as ExtendedWalletClient;

    this.IDRX_ADDRESS = tokenAddress[CHAINS.arbitrum.id]['Mock_IDRX'];
  }

  async burnIdrx(amount: string): Promise<BurnResult> {
    try {
      this.logger.log(`Starting IDRX burn: ${amount} IDRX`);

      const amountInWei = parseUnits(amount, 2);

      const currentBalanceInWei = await this.walletClient.readContract({
        address: this.IDRX_ADDRESS as Address,
        abi: idrxAbi,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      const currentBalance = formatUnits(currentBalanceInWei, 2);

      if (currentBalanceInWei < amountInWei) {
        throw new Error(
          `Insufficient IDRX balance. Available: ${currentBalance}, Required: ${amount}`,
        );
      }

      this.logger.log(`Current IDRX balance: ${currentBalance}`);

      const txHash = await this.walletClient.writeContract({
        address: this.IDRX_ADDRESS as Address,
        abi: idrxAbi,
        functionName: 'burn',
        args: [amountInWei],
        account: this.account,
        chain: CHAINS.arbitrum,
      });

      this.logger.log(`Burn transaction sent: ${txHash}`);

      const receipt = await this.walletClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const result: BurnResult = {
        transactionHash: txHash,
        status: receipt.status === 'success' ? 'success' : 'failed',
        gasUsed: receipt.gasUsed?.toString(),
        blockNumber: Number(receipt.blockNumber),
        amountBurned: amount,
        balance: formatUnits(currentBalanceInWei - amountInWei, 2),
      };

      this.logger.log(`IDRX burn completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Error burning IDRX tokens', error);
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
