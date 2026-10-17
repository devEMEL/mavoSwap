export interface TokenConfig {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  chainId?: number;
}

export const TOKENS_BY_CHAIN: Record<number, TokenConfig[]> = {
  // BotChain Mainnet (677)
  677: [
      {
      address: "0x0000000000000000000000000000000000000000",
      name: "BOT",
      symbol: "BOT",
      decimals: 18,
      logo: "/botchain.png",
      chainId: 677,
    },
      {
      address: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
      name: "USDT",
      symbol: "USDT",
      decimals: 6,
      logo: "/usdt.png",
      chainId: 677,
    },
    {
      address: "0x0022e57d97A5976A9877c7127068A4A26BBbD39C",
      name: "rBOT",
      symbol: "rBOT",
      decimals: 18,
      logo: "/botchain.png",
      chainId: 677,
    },
    {
      address: "0xaB74155663ed19395B2c81b4197E4F714629A42c",
      name: "rUSDT",
      symbol: "rUSDT",
      decimals: 6,
      logo: "/usdt.png",
      chainId: 677,
    },
    
  ],
  // Elysium Testnet (99801)
  99801: [
    // {
    //   address: "0x0026de59CF2cD3a581897366DCA1aFa33C6CE312",
    //   name: "rHYPE",
    //   symbol: "rHYPE",
    //   decimals: 18,
    //   logo: "/assets/0x0026de59CF2cD3a581897366DCA1aFa33C6CE312/logo.png",
    //   chainId: 99801,
    // },
    // {
    //   address: "0x7dD76b622AF7eE379326374513E17934246C3c98",
    //   name: "rUSDC",
    //   symbol: "rUSDC",
    //   decimals: 6,
    //   logo: "/assets/0x7dD76b622AF7eE379326374513E17934246C3c98/logo.png",
    //   chainId: 99801,
    // },
  ],
};

export function getTokens(chainId?: number): TokenConfig[] {
  if (chainId && TOKENS_BY_CHAIN[chainId]) {
    return TOKENS_BY_CHAIN[chainId];
  }
  return TOKENS_BY_CHAIN[677] || TOKENS_BY_CHAIN[99801];
}

// Flat list of all supported tokens across chains for search / backwards-compatibility
export const TOKENS: TokenConfig[] = [
  ...TOKENS_BY_CHAIN[677],
  ...TOKENS_BY_CHAIN[99801],
];
