import { onchainTable, onchainEnum } from "ponder";

/**
 * Generates an enum of liquid mining season values.
 *
 * @param numSeasons - The number of seasons to generate.
 * @returns An array of enum values representing the liquid mining seasons.
 * @example generateLMSeasonEnum(120) => [ "liquid_mining_first_wallet_season_1", "liquid_mining_first_wallet_season_2", ... ]
 */
const generateLMSeasonEnum = (numSeasons: number) => {
  const enumValues = [];
  for (let i = 1; i <= numSeasons; i++) {
    enumValues.push(`liquid_mining_first_wallet_season_${i}`);
  }
  return enumValues;
};

/**
 * An array that represents the different sources of points in the Stratosphere system.
 * Each element in the array represents a specific source of points along with its description.
 * The value of each point is represented in 1 USDC (10^6).
 *
 * @remarks
 * The available sources of points in the Stratosphere system are:
 * - "stratosphere_enrollment": Indexes enrollment in Stratosphere (150 * 10^6 points)
 * - "dex_aggregator_swap": Indexes swap with USDC value >= 1 USDC (USDC value greater or equal to 1^6)
 * - "dex_aggregator_1k_swaps":  Indexes swap with USDC value >= 1k USDC (500 * 10^6 points)
 * - "dex_aggregator_10k_swaps": Indexes swap with USDC value >= 10k USDC (1000 * 10^6 points)
 * - "dex_aggregator_100k_swaps": Indexes swap with USDC value >= 100k USDC (5000 * 10^6 points)
 * - "vape_staking_first_deposit": Indexes first deposit in Vape Staking (100 * 10^6 points)
 * - "vape_staking_first_wallet": Indexes first wallet in Vape Staking (500 * 10^6 points)
 * - "liquid_mining_first_deposit": Indexes first deposit in Liquid Mining (100 * 10^6 points)
 * - "liquid_mining_one_season": Indexes one season in Liquid Mining (100 * 10^6 points)
 * - "liquid_mining_three_seasons": Indexes three seasons in Liquid Mining (200 * 10^6 points)
 * - "liquid_mining_six_seasons": Indexes six seasons in Liquid Mining (300 * 10^6 points)
 * - "liquid_mining_twelve_seasons": Indexes twelve seasons in Liquid Mining (1000 * 10^6 points)
 * - ...generateLMSeasonEnum(120): Indexes first wallet in a Liquid Mining new season (500 * 10^6 points)
 */
export const pointsSourceEnum = onchainEnum("PointsSource", [
  "stratosphere_enrollment",
  "chain_first_wallet",
  "dex_aggregator_swap",
  "dex_aggregator_first_swap",
  "dex_aggregator_1k_swaps",
  "dex_aggregator_10k_swaps",
  "dex_aggregator_100k_swaps",
  "vape_staking_first_deposit",
  "vape_staking_first_wallet",
  "liquid_mining_first_deposit",
  "liquid_mining_one_season",
  "liquid_mining_three_seasons",
  "liquid_mining_six_seasons",
  "liquid_mining_twelve_seasons",
  ...generateLMSeasonEnum(120),
]);

export const pointsTable = onchainTable("Points", (t) => ({
  id: t.text().primaryKey().notNull(),
  pointsSource: pointsSourceEnum("PointsSource").notNull(),
  points: t.bigint(),
  userHistoryId: t.text().notNull(),
  userDataId: t.text().notNull(),
  chainId: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}));

//////////////////////////////////////////
////////////// Helper Tables /////////////
//////////////////////////////////////////

// @dev: Id is the user's wallet address + chainId
export const userHistoryTable = onchainTable("UserHistory", (t) => ({
  id: t.text().primaryKey().notNull(),
  chainId: t.integer().notNull(),
  LMSeasons: t.bigint().array().notNull(), // If the array is empty, the user has not participated in any season
  depositInVS: t.boolean().notNull(),
  chainFirstWallet: t.boolean().notNull(),
  firstWalletInVPNDLM: t.boolean().notNull(),
  firstWalletInVAPELM: t.boolean().notNull(),
  LMOneSeasonPointsClaimed: t.boolean().notNull(),
  LMThreeSeasonsPointsClaimed: t.boolean().notNull(),
  LMSixSeasonsPointsClaimed: t.boolean().notNull(),
  LMOneYearPointsClaimed: t.boolean().notNull(),
  usdValueOfSwaps: t.bigint().notNull(),
  swaps: t.bigint().notNull(),
  firstSwap: t.boolean().notNull(),
  first1kSwaps: t.boolean().notNull(),
  first10kSwaps: t.boolean().notNull(),
  first100kSwaps: t.boolean().notNull(),
}));

// @dev: Id is the user's wallet address + chainId
export const userDataTable = onchainTable("UserData", (t) => ({
  id: t.text().primaryKey().notNull(),
  linkedToTokenId: t.bigint().notNull(),
  isMainWallet: t.boolean().notNull(),
  chainId: t.integer().notNull(),
}));

export const allProtocolsTable = onchainTable("AllProtocols", (t) => ({
  id: t.text().primaryKey().notNull(),
  firstWallet: t.text().notNull(),
}));

// @dev: Id is the seasonId
export const liquidMiningTable = onchainTable("LiquidMining", (t) => ({
  id: t.bigint().primaryKey().notNull(),
  firstWallet: t.text().notNull(),
}));

export const vapeStakingTable = onchainTable("VapeStaking", (t) => ({
  id: t.text().primaryKey().notNull(),
  firstWallet: t.text().notNull(),
  txnHash: t.text().notNull(),
}));

// @dev: Id is the tokenId + chainId
export const tokenIdDataTable = onchainTable("TokenIdData", (t) => ({
  id: t.text().primaryKey().notNull(),
  tokenId: t.bigint().notNull(),
  chainId: t.integer().notNull(),
  pointsEarned: t.bigint().notNull(),
  pointsClaimed: t.bigint().notNull(),
  pointsSpent: t.bigint().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

// @dev: Id is the tokenId + chainId + weekId
export const tokenIdDataWeeklyTable = onchainTable(
  "TokenIdDataWeekly",
  (t) => ({
    id: t.text().primaryKey().notNull(),
    tokenId: t.bigint().notNull(),
    chainId: t.integer().notNull(),
    pointsEarned: t.bigint().notNull(),
    pointsClaimed: t.bigint().notNull(),
    pointsSpent: t.bigint().notNull(),
    lastUpdated: t.bigint().notNull(),
  })
);

// @dev: Id is the tierId + chainId
// @dev: The tierId is the tier number
// @dev: wallets is the number of wallets in the tier
export const walletsPerTierTable = onchainTable("WalletsPerTier", (t) => ({
  id: t.text().primaryKey().notNull(),
  wallets: t.text().array().notNull(),
}));
