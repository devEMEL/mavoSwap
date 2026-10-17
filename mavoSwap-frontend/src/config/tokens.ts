export interface TokenConfig {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}


export const TOKENS: TokenConfig[] = [

  {
    "address": "0x0026de59CF2cD3a581897366DCA1aFa33C6CE312",
    "name": "rHYPE",
    "symbol": "rHYPE",
    "decimals": 18,
    "logo": "/assets/0x0026de59CF2cD3a581897366DCA1aFa33C6CE312/logo.png"
  },

  {
    "address": "0x7dD76b622AF7eE379326374513E17934246C3c98" as `0x${string}`,
    "name": "rUSDC",
    "symbol": "rUSDC",
    "decimals": 6,
    "logo": "/assets/0x7dD76b622AF7eE379326374513E17934246C3c98/logo.png"
  }

];
