// --- Elysium Testnet (99801) Default Addresses ---
export const USDC_ADDRESS = "0x7D29d8047B905000459c0E80c34a26CeedcB47b2";
export const HYPE_ADDRESS = "0x0000000000000000000000000000000000000000";
export const RHYPE_ADDRESS = "0x0026de59CF2cD3a581897366DCA1aFa33C6CE312";
export const RUSDC_ADDRESS = "0x7dD76b622AF7eE379326374513E17934246C3c98";

// --- BotChain Mainnet (677) Addresses ---
export const BOT_ADDRESS = "0x0000000000000000000000000000000000000000";
export const RBOT_ADDRESS = "0x0022e57d97A5976A9877c7127068A4A26BBbD39C";
export const USDT_ADDRESS = "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C";
export const RUSDT_ADDRESS = "0xaB74155663ed19395B2c81b4197E4F714629A42c";

export interface ChainContracts {
  poolManager: `0x${string}`;
  quoter: `0x${string}`;
  permit2: `0x${string}`;
  positionManager: `0x${string}`;
  stateView: `0x${string}`;
  universalRouter: `0x${string}`;
  weth?: `0x${string}`;
  positionDescriptor?: `0x${string}`;
}

export const CONTRACTS_BY_CHAIN: Record<number, ChainContracts> = {
  // Elysium Testnet (99801)
  99801: {
    poolManager: "0x383f1aef5282754Fc48578E1dA834dC01223F75F",
    quoter: "0x34F0CAdb9Be160DEc8dB4479A73122968Ca890C8",
    permit2: "0xcf3C40142ff5C31b71c59f5191AAe26093742F2a",
    positionManager: "0x7d00dB5115Db5e02ef0550E51BB459F7c72e5999",
    stateView: "0x5EFc49235E5a61ee84ccD97ca5109F997aFb5959",
    universalRouter: "0x38d1FeCCef299Bba6B826e9cE5B628c817DB03c5",
    weth: "0x57C544AAcfBa98b299361C47DDAe391720Ba4aec",
  },
  // BotChain Mainnet (677)
  677: {
    poolManager: "0x38F0520f45894020adB79591A1949D3aAFb3921d",
    quoter: "0xb05b48a914507E17FD955851DFaE02B24ad4E207",
    permit2: "0x1aB7a432b6FD491597c6D3C6590221993561C103",
    positionManager: "0xaeC83eb392c67432022362C3dddA59cefFB0898B",
    stateView: "0x412818d374C12Bb9374723D2065Bde75C445c9e5",
    universalRouter: "0x8850386bBc1B5A7539eD34b6cEBDAcEf7c226230",
    positionDescriptor: "0x62C6B01286f1aCD9EE01D6bEee4B3D8002424634",
    weth: "0xA785dEEfF31941AF1802408943bfB347087602Cd",
  },
};

export function getContracts(chainId?: number): ChainContracts {
  if (chainId && CONTRACTS_BY_CHAIN[chainId]) {
    return CONTRACTS_BY_CHAIN[chainId];
  }
  return CONTRACTS_BY_CHAIN[677] || CONTRACTS_BY_CHAIN[99801];
}

// Backward compatibility defaults (Elysium)
export const POOLMANAGER_ADDRESS = CONTRACTS_BY_CHAIN[99801].poolManager;
export const V4_QUOTER_ADDRESS = CONTRACTS_BY_CHAIN[99801].quoter;
export const PERMIT2_ADDRESS = CONTRACTS_BY_CHAIN[99801].permit2;
export const WETH_ADDRESS = CONTRACTS_BY_CHAIN[99801].weth!;
export const POSITION_MANAGER_ADDRESS = CONTRACTS_BY_CHAIN[99801].positionManager;
export const STATEVIEW_ADDRESS = CONTRACTS_BY_CHAIN[99801].stateView;
export const UNIVERSALROUTER_ADDRESS = CONTRACTS_BY_CHAIN[99801].universalRouter;

export const ACTIONS = {
  // --- Liquidity Actions (PositionManager) ---
  INCREASE_LIQUIDITY: 0x00,              // 0
  DECREASE_LIQUIDITY: 0x01,              // 1
  MINT_POSITION: 0x02,                   // 2
  BURN_POSITION: 0x03,                   // 3
  INCREASE_LIQUIDITY_FROM_DELTAS: 0x04,  // 4
  MINT_POSITION_FROM_DELTAS: 0x05,       // 5

  // --- Swap Actions (Router) ---
  SWAP_EXACT_IN_SINGLE: 0x06,            // 6
  SWAP_EXACT_IN: 0x07,                   // 7
  SWAP_EXACT_OUT_SINGLE: 0x08,           // 8
  SWAP_EXACT_OUT: 0x09,                  // 9

  // --- Utility & Payments ---
  DONATE: 0x0a,                          // 10
  SETTLE: 0x0b,                          // 11
  SETTLE_ALL: 0x0c,                      // 12
  SETTLE_PAIR: 0x0d,                     // 13
  TAKE: 0x0e,                            // 14
  TAKE_ALL: 0x0f,                        // 15
  TAKE_PORTION: 0x10,                    // 16
  TAKE_PAIR: 0x11,                       // 17
  CLOSE_CURRENCY: 0x12,                  // 18
  CLEAR_OR_TAKE: 0x13,                   // 19
  SWEEP: 0x14,                           // 20
  WRAP: 0x15,                            // 21
  UNWRAP: 0x16,                          // 22

  // --- ERC-6909 Actions ---
  MINT_6909: 0x17,                       // 23
  BURN_6909: 0x18                        // 24
} as const;
