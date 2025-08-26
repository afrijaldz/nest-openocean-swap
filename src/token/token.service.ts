import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHAINS,
  OPENOCEAN_ROUTER_ADDRESS,
  tokenAddress,
} from 'src/common/constants';
import { ExtendedWalletClient } from 'src/common/types';
import {
  Account,
  Address,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  publicActions,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly walletClient: ExtendedWalletClient;
  private readonly account: Account;

  private readonly USDT_ADDRESS: string;
  private readonly IDRX_ADDRESS: string;
  private readonly OPENOCEAN_ROUTER_ADDRESS: string;

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

    this.USDT_ADDRESS = tokenAddress[42161]['Mock_USDT'];
    this.IDRX_ADDRESS = tokenAddress[42161]['Mock_IDRX'];
    this.OPENOCEAN_ROUTER_ADDRESS = OPENOCEAN_ROUTER_ADDRESS;
  }

  async getAccountBalance(): Promise<{
    usdt: string;
    idrx: string;
  }> {
    try {
      const usdtBalanceInWei = await this.walletClient.readContract({
        address: this.USDT_ADDRESS as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      const idrxBalanceInWei = await this.walletClient.readContract({
        address: this.IDRX_ADDRESS as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      return {
        usdt: usdtBalanceInWei.toString(),
        idrx: formatUnits(idrxBalanceInWei, 2),
      };
    } catch (error) {
      this.logger.error('Error getting account balance', error);
      throw error;
    }
  }

  async checkAndApproveToken(
    tokenAddress: string,
    amount: bigint,
  ): Promise<void> {
    try {
      const allowance = await this.walletClient.readContract({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [this.account.address, this.OPENOCEAN_ROUTER_ADDRESS as Address],
      });

      this.logger.log(
        `Current allowance: ${allowance.toString()}, Required: ${amount.toString()}`,
      );

      if (allowance < amount) {
        this.logger.log('Insufficient allowance, approving token...');

        const approveTx = await this.walletClient.writeContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [this.OPENOCEAN_ROUTER_ADDRESS as Address, amount],
          account: this.account,
          chain: CHAINS.arbitrum,
        });

        this.logger.log(`Approval transaction sent: ${approveTx}`);

        await this.walletClient.waitForTransactionReceipt({
          hash: approveTx,
        });

        this.logger.log('Token approval confirmed');
      } else {
        this.logger.log('Sufficient allowance already exists');
      }
    } catch (error) {
      this.logger.error('Error checking/approving token', error);
      throw error;
    }
  }
}
