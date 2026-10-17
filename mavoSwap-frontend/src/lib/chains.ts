import { defineChain } from '@reown/appkit/networks';

export const BLOCK_EXPLORER_URL = 'https://elysium.kinetiq.xyz/testnet-explorer';

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
      url: BLOCK_EXPLORER_URL,
    },
  },
});

// Backward compatibility alias
export const arcMainnet = elysiumTestnet;