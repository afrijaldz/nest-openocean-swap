import { Injectable, Logger } from '@nestjs/common';
import { SwapQuoteResponse } from './swap';
import {
  Account,
  Address,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseEventLogs,
  parseUnits,
  publicActions,
} from 'viem';
import { ExtendedWalletClient, TransactionResult } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CHAINS, tokenAddress } from 'src/common/constants';
import { privateKeyToAccount } from 'viem/accounts';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TokenService } from 'src/token/token.service';
import { BurnResult } from 'src/burn/burn';
import { BurnService } from 'src/burn/burn.service';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  private readonly walletClient: ExtendedWalletClient;
  private readonly account: Account;
  private readonly openOceanApiUrl: string;

  private readonly USDT_ADDRESS: string;
  private readonly IDRX_ADDRESS: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private tokenService: TokenService,
    private burnService: BurnService,
  ) {
    this.openOceanApiUrl = this.configService.get<string>(
      'OPEN_OCEAN_API_URL',
    ) as string;

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

    this.USDT_ADDRESS = tokenAddress[CHAINS.arbitrum.id]['Mock_USDT'];
    this.IDRX_ADDRESS = tokenAddress[CHAINS.arbitrum.id]['Mock_IDRX'];
  }

  async getSwapQuote(
    inTokenAddress: string,
    outTokenAddress: string,
    amount: string,
    slippage: number = 1,
  ): Promise<SwapQuoteResponse> {
    try {
      const gasPrice = await this.walletClient.getGasPrice();

      const params = {
        inTokenAddress,
        outTokenAddress,
        amount,
        gasPrice: gasPrice.toString(),
        slippage,
        account: this.account.address,
      };

      this.logger.log(`Getting quote for swap: ${JSON.stringify(params)}`);

      const { data }: AxiosResponse<SwapQuoteResponse> = await firstValueFrom(
        this.httpService.get(
          `${this.openOceanApiUrl}/${CHAINS.arbitrum.id}/swap`,
          {
            params,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (data.code !== 200) {
        throw new Error(`OpenOcean API error: ${data.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error getting quote from OpenOcean', error);
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  async swapUsdtToIdrx(usdtAmount: string): Promise<TransactionResult> {
    try {
      this.logger.log(`Starting swap: ${usdtAmount} USDT -> IDRX`);

      const amountInWei = parseUnits(usdtAmount, 6);
      const slippage = 1;

      const quote = await this.getSwapQuote(
        this.USDT_ADDRESS,
        this.IDRX_ADDRESS,
        usdtAmount,
        slippage,
      );

      this.logger.log(`Quote received: ${JSON.stringify(quote.data)}`);

      await this.tokenService.checkAndApproveToken(
        this.USDT_ADDRESS,
        amountInWei,
      );

      const txHash = await this.walletClient.sendTransaction({
        account: this.account,
        to: quote.data.to as Address,
        data: quote.data.data as Address,
        gas: BigInt((BigInt(quote.data.estimatedGas) * 125n) / 100n),
        chain: CHAINS.arbitrum,
      });

      this.logger.log(`Transaction sent: ${txHash}`);

      const receipt = await this.walletClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const result: TransactionResult = {
        transactionHash: txHash,
        status: receipt.status === 'success' ? 'success' : 'failed',
        gasUsed: receipt.gasUsed?.toString(),
        blockNumber: Number(receipt.blockNumber),
      };

      this.logger.log(`Swap completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Error executing swap', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'error on swapUsdtToIdrx occurred';
      throw new Error(errorMessage);
    }
  }

  async swapUsdtToIdrxThenBurnIdrx(usdtAmount: string): Promise<{
    swap: TransactionResult;
    burn: BurnResult;
  }> {
    try {
      const swapResult = await this.swapUsdtToIdrx(usdtAmount);

      if (swapResult.status === 'failed') {
        throw new Error('Swap failed');
      }

      const receipt = await this.walletClient.waitForTransactionReceipt({
        hash: swapResult.transactionHash as Address,
      });

      const parsed = parseEventLogs({
        abi: erc20Abi,
        eventName: 'Transfer',
        logs: receipt.logs,
        strict: false,
      });

      let idrxValue: bigint | undefined;

      for (const ev of parsed) {
        if (ev.address?.toLowerCase() !== this.IDRX_ADDRESS.toLowerCase())
          continue;

        const { to, value } = ev.args as {
          from: string;
          to: string;
          value: bigint;
        };

        if (to.toLowerCase() === this.account.address.toLowerCase()) {
          idrxValue = value;
          break;
        }
      }

      if (!idrxValue) {
        throw new Error(
          'Could not find IDRX transfer event in transaction receipt',
        );
      }

      const idrxAmount: string = formatUnits(idrxValue, 2);

      const burnResult = await this.burnService.burnIdrx(idrxAmount);

      return {
        swap: swapResult,
        burn: burnResult,
      };
    } catch (error) {
      this.logger.error('Error executing swap and burn', error);
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
