# NestJS OpenOcean Swap Application

A NestJS application that uses OpenOcean v4 API to perform token swaps on Arbitrum One. This application specifically demonstrates swapping USDT to IDRX using viem for blockchain interactions.

## Features

- ✅ Swap USDT to IDRX using OpenOcean v4 API
- ✅ Burn IDRX tokens directly from your wallet
- ✅ Combined swap and burn operation in one endpoint
- ✅ Check wallet balances (USDT, IDRX)
- ✅ Automatic token approval handling
- ✅ Type-safe blockchain interactions with viem
- ✅ Error handling and logging

## Token Addresses (Arbitrum One)

- **USDT**: `0xC163e796833a532C6AB1b4101B5dBF5c279db60a`
- **IDRX**: `0xA769d6492d58840fc1DF124fA4fd3a96B5ef0E71`
- **OpenOcean Router**: `0x6352a56caadC4F1E25CD6c75970Fa768A3304e64`

## Prerequisites

- Node.js (v18 or later)
- pnpm (or npm/yarn)
- Private key for an Arbitrum One wallet with USDT balance
- ETH for gas fees on Arbitrum One

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.template .env
```

3. Edit `.env` file with your private key:

```env
PRIVATE_KEY=0x_your_private_key_here
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPENOCEAN_API_BASE_URL=https://open-api.openocean.finance/v4
```

## Running the Application

### Development

```bash
pnpm run start:dev
```

### Production

```bash
pnpm run build
pnpm run start:prod
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Health Check

```
GET /
```

Returns a simple "Hello World!" message.

### Get Wallet Balance

```
GET /token/balance
```

Returns the balance of USDT and IDRX for the configured wallet.

**Response:**

```json
{
  "usdt": "100.0",
  "idrx": "0.0"
}
```

### Swap USDT to IDRX

```
POST /swap/usdt-to-idrx
```

Execute a swap from USDT to IDRX.

**Request Body:**

```json
{
  "usdtAmount": "10.0"
}
```

**Response:**

```json
{
  "transactionHash": "0x...",
  "status": "success",
  "gasUsed": "150000",
  "blockNumber": 12345678
}
```

### Swap USDT to IDRX and Burn

```
POST /swap/usdt-to-idrx-then-burn-idrx
```

Execute a swap from USDT to IDRX and then immediately burn the received IDRX tokens.

**Request Body:**

```json
{
  "usdtAmount": "10.0"
}
```

**Response:**

```json
{
  "swap": {
    "transactionHash": "0x...",
    "status": "success",
    "gasUsed": "150000",
    "blockNumber": 12345678
  }
}
```

### Burn IDRX Tokens

```
POST /burn/burn-idrx
```

Burn IDRX tokens from your wallet.

**Request Body:**

```json
{
  "idrxAmount": "100.0"
}
```

**Response:**

```json
{
  "transactionHash": "0x...",
  "status": "success",
  "gasUsed": "50000",
  "blockNumber": 12345679
}
```

## Usage Examples

### Using curl

1. Check balance:

```bash
curl http://localhost:3000/token/balance
```

2. Execute swap:

```bash
curl -X POST http://localhost:3000/swap/usdt-to-idrx \
  -H "Content-Type: application/json" \
  -d '{
    "usdtAmount": "10.0"
  }'
```

3. Execute swap and burn in one operation:

```bash
curl -X POST http://localhost:3000/swap/usdt-to-idrx-then-burn-idrx \
  -H "Content-Type: application/json" \
  -d '{
    "usdtAmount": "10.0"
  }'
```

4. Burn IDRX tokens:

```bash
curl -X POST http://localhost:3000/burn/burn-idrx \
  -H "Content-Type: application/json" \
  -d '{
    "idrxAmount": "100.0"
  }'
```

## Architecture

- **SwapService**: Handles USDT to IDRX swaps and combined swap-burn operations using OpenOcean API
- **BurnService**: Handles IDRX token burning operations
- **TokenService**: Handles token balance queries
- **SwapController**: REST API endpoints for swap operations
- **BurnController**: REST API endpoints for burn operations
- **TokenController**: REST API endpoints for token operations
- **Types**: TypeScript interfaces for type safety
- **Viem**: Ethereum library for blockchain interactions

## Error Handling

The application includes comprehensive error handling for:

- Invalid private keys
- Insufficient balances
- Network connectivity issues
- OpenOcean API errors
- Transaction failures

## Development

### Run tests

```bash
pnpm run test
```

### Lint code

```bash
pnpm run lint
```

### Format code

```bash
pnpm run format
```

## License

UNLICENSED
