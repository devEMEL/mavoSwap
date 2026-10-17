export const USDC_ADDRESS = "0x7D29d8047B905000459c0E80c34a26CeedcB47b2";
export const HYPE_ADDRESS = "0x0000000000000000000000000000000000000000";
export const RHYPE_ADDRESS = "0x0026de59CF2cD3a581897366DCA1aFa33C6CE312";
export const RUSDC_ADDRESS = "0x7dD76b622AF7eE379326374513E17934246C3c98";

export const POOLMANAGER_ADDRESS = "0x383f1aef5282754Fc48578E1dA834dC01223F75F";
export const V4_QUOTER_ADDRESS = "0x34F0CAdb9Be160DEc8dB4479A73122968Ca890C8";
export const PERMIT2_ADDRESS = "0xcf3C40142ff5C31b71c59f5191AAe26093742F2a";
export const WETH_ADDRESS = "0x57C544AAcfBa98b299361C47DDAe391720Ba4aec";
export const POSITION_MANAGER_ADDRESS = "0x7d00dB5115Db5e02ef0550E51BB459F7c72e5999";
export const STATEVIEW_ADDRESS = "0x5EFc49235E5a61ee84ccD97ca5109F997aFb5959";
export const UNIVERSALROUTER_ADDRESS = "0x38d1FeCCef299Bba6B826e9cE5B628c817DB03c5";



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


