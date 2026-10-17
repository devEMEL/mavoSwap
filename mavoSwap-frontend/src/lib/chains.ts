import { defineChain } from '@reown/appkit/networks';

export const ELYSIUM_EXPLORER_URL = 'https://elysium.kinetiq.xyz/testnet-explorer';
export const BOTCHAIN_EXPLORER_URL = 'https://scan.botchain.ai';
export const BLOCK_EXPLORER_URL = ELYSIUM_EXPLORER_URL;

export const elysiumTestnet = defineChain({
  id: 99801,
  caipNetworkId: 'eip155:99801',
  chainNamespace: 'eip155',
  name: 'Elysium Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: [
        'https://testnet-rpc.elysium.kinetiq.xyz',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Elysium Explorer',
      url: ELYSIUM_EXPLORER_URL,
    },
  },
});

export const botchainMainnet = defineChain({
  id: 677,
  caipNetworkId: 'eip155:677',
  chainNamespace: 'eip155',
  name: 'BotChain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.botchain.ai',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'BotChain Explorer',
      url: BOTCHAIN_EXPLORER_URL,
    },
  },
});

export const SUPPORTED_CHAINS = [botchainMainnet, elysiumTestnet] as const;
export const DEFAULT_CHAIN = botchainMainnet;

export function getChainById(chainId?: number) {
  if (chainId === botchainMainnet.id) return botchainMainnet;
  if (chainId === elysiumTestnet.id) return elysiumTestnet;
  return DEFAULT_CHAIN;
}

export function getExplorerUrl(chainId?: number): string {
  if (chainId === botchainMainnet.id) return BOTCHAIN_EXPLORER_URL;
  return ELYSIUM_EXPLORER_URL;
}

// Backward compatibility alias
export const arcMainnet = elysiumTestnet;