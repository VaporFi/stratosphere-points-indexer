export const INT_ZERO = 0;
export const BIGINT_ZERO = 0n;
export const BIGINT_ONE = 1n;
export const BIGINT_TWO = 2n;
export const BIGINT_THREE = 3n;
export const BIGINT_FOUR = 4n;
export const BIGINT_FIVE = 5n;
export const BIGINT_SIX = 6n;
export const BIGINT_SEVEN = 7n;
export const BIGINT_EIGHT = 8n;
export const BIGINT_NINE = 9n;
export const BIGINT_TEN = 10n;
export const BIGINT_HUNDRED = 100n;
export const BIGINT_THOUSAND = 1000n;
export const BIGINT_TEN_THOUSAND = 10000n;
export const BIGINT_HUNDRED_THOUSAND = 100000n;
export const USDC_DECIMALS = 6n;

/**
 * @dev The minimum number of points required to represent 1 USDC.
 * @dev While adding any new chain, make sure to check USDC decimals on that chain and create a mapping for it.
 */
export const MINIMUM_POINTS = 1000000n;

/**
 * Enum representing different chains.
 */
export enum Chains {
  AVALANCHE = "avalanche",
  AVALANCHE_TESTNET = "fuji",
  BSC = "bsc",
  BSC_TESTNET = "bscTestnet",
  TELOS = "telos",
  TELOS_TESTNET = "telosTestnet",
}

type AddressMap = {
  [key: string]: {
    [K in Chains]?: `0x${string}`;
  };
};

/**
 * Mapping of chain IDs for different chains.
 */
export const chainId = {
  [Chains.AVALANCHE]: 43114,
  [Chains.AVALANCHE_TESTNET]: 43113,
  [Chains.BSC]: 56,
  [Chains.BSC_TESTNET]: 97,
  [Chains.TELOS]: 40,
  [Chains.TELOS_TESTNET]: 41,
} as const;

export type ChainId = typeof chainId;

/**
 * Mapping of assets for different chains.
 */
export const assets = {
  [Chains.AVALANCHE]: {
    WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    WETHe: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    USDTe: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
    USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    USDCe: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
    WBTCe: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    DAIe: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    USDt: "0xde3A24028580884448a5397872046a019649b084",
    BTCb: "0x152b9d0FdC40C096757F570A51E494bd4b943E50",
  },
};

export const deployedBlockTimestamps = {
  [Chains.AVALANCHE]: {
    Stratosphere: 20310567,
    DexAggregator: 20308160,
    LiquidMining: 32271032,
    VapeStaking: 33291048,
    RewardsController: 33291048,
  },
};

/**
 * Mapping of addresses for different contracts.
 */
export const addresses: AddressMap = {
  Stratosphere: {
    [Chains.AVALANCHE]: "0x08e287adCf9BF6773a87e1a278aa9042BEF44b60",
  },

  DexAggregator: {
    [Chains.AVALANCHE]: "0xDef9ee39FD82ee57a1b789Bc877E2Cbd88fd5caE",
  },
  LiquidMining: {
    [Chains.AVALANCHE]: "0xAe950fdd0CC79DDE64d3Fffd40fabec3f7ba368B",
  },
  VapeStaking: {
    [Chains.AVALANCHE]: "0x1C9Cba0CEc8aD45f75D5F5bdb0c539AcB55B8D94",
  },
  RewardsController: {
    [Chains.AVALANCHE]: "0x2A8cE9F8Df3c4C1f4b8b3f1bE5D1Df0E7b8DfA4E", // Change this
  },
};

/**
 * Mapping of points for different actions.
 */
export const pointsMap = {
  // Create a new Stratosphere membership
  Enrollment: 150n * MINIMUM_POINTS,
  // User completes first swap on VaporDEX
  FirstSwap: 50n * MINIMUM_POINTS,
  // User swaps a total of $1K on VaporDEX
  ThousandSwaps: 500n * MINIMUM_POINTS,
  // User swaps a total of $10K on VaporDEX
  TenThousandSwaps: 1000n * MINIMUM_POINTS,
  // User swaps a total of $100K on VaporDEX
  HundredThousandSwaps: 5000n * MINIMUM_POINTS,
  // User deposits in VPND LM for the first time
  FirstDepositInVPNDLM: 100n * MINIMUM_POINTS,
  // User deposits in VAPE LM for the first time
  FirstDepositInVAPELM: 100n * MINIMUM_POINTS,
  // The first wallet to have deposited in a VPND LM season
  FirstWalletInVPNDLM: 500n * MINIMUM_POINTS,
  // The first wallet to have deposited in VAPE LM
  FirstWalletInVAPELM: 500n * MINIMUM_POINTS,
  // User participates in one season of VPND LM
  OneSeasonVPNDLMLock: 100n * MINIMUM_POINTS,
  // User participates in three seasons of VPND LM
  ThreeSeasonVPNDLMLock: 200n * MINIMUM_POINTS,
  // User participates in six seasons of VPND LM
  SixSeasonVPNDLMLock: 300n * MINIMUM_POINTS,
  // User participates in twelve seasons of VPND LM
  OneYearVPNDLMLock: 1000n * MINIMUM_POINTS,
  // User participates in one season of VAPE LM
  ChainFirstWallet: 500n * MINIMUM_POINTS,
};
