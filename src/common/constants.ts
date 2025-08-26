import { Address } from 'viem';
import { arbitrum } from 'viem/chains';

export const CHAINS = {
  arbitrum,
};

export const tokenAddress: Record<
  (typeof CHAINS)[keyof typeof CHAINS]['id'],
  Record<string, Address>
> = {
  42161: {
    Mock_USDT: '0xC163e796833a532C6AB1b4101B5dBF5c279db60a',
    Mock_IDRX: '0xA769d6492d58840fc1DF124fA4fd3a96B5ef0E71',
  },
};

export const OPENOCEAN_ROUTER_ADDRESS =
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
