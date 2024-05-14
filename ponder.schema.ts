import { createSchema } from "@ponder/core";

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
const pointsSource = [
  "stratosphere_enrollment",
  "dex_aggregator_swap",
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
];

export default createSchema((p) => ({
  PointsSource: p.createEnum(pointsSource),
  Points: p.createTable({
    id: p.string(),
    // Use enum for points source
    pointsSource: p.enum("PointsSource"),
    points: p.bigint().optional(),

    // Reference to user history
    userHistoryId: p.string().references("UserHistory.id"),
    userHistory: p.one("userHistoryId"),

    // Reference to user data
    userDataId: p.string().references("UserData.id"),
    userData: p.one("userDataId"),

    // Chain data
    chainId: p.int(),
    timestamp: p.bigint(),
  }),

  //////////////////////////////////////////
  ////////////// Helper Tables /////////////
  //////////////////////////////////////////

  // @dev: Id is the user's wallet address + chainId
  UserHistory: p.createTable({
    id: p.string(),
    chainId: p.int(),
    LMSeasons: p.bigint().list(), // If the array is empty, the user has not participated in any season
    depositInVS: p.boolean(),
    firstWalletInVPNDLM: p.boolean(),
    firstWalletInVAPELM: p.boolean(),
    LMOneSeasonPointsClaimed: p.boolean(),
    LMThreeSeasonsPointsClaimed: p.boolean(),
    LMSixSeasonsPointsClaimed: p.boolean(),
    LMOneYearPointsClaimed: p.boolean(),
    usdValueOfSwaps: p.bigint(),
    swaps: p.bigint(),
    firstSwap: p.boolean(),
    first1kSwaps: p.boolean(),
    first10kSwaps: p.boolean(),
    first100kSwaps: p.boolean(),
  }),

  // @dev: Id is the user's wallet address + chainId
  UserData: p.createTable({
    id: p.string(),
    linkedToTokenId: p.bigint(),
    isMainWallet: p.boolean(),
    chainId: p.int(),
  }),

  // @dev: Id is the seasonId
  LiquidMining: p.createTable({
    id: p.bigint(),
    firstWallet: p.string(),
  }),

  VapeStaking: p.createTable({
    id: p.string(),
    firstWallet: p.string(),
    txnHash: p.string(),
  }),

  // @dev: Id is the tokenId + chainId
  TokenIdData: p.createTable({
    id: p.string(),
    tokenId: p.bigint(),
    chainId: p.int(),
    pointsEarned: p.bigint(),
    pointsClaimed: p.bigint(),
    pointsSpent: p.bigint(),
    lastUpdated: p.bigint(),
  }),

  // @dev: Id is the tokenId + chainId + weekId
  TokenIdDataWeekly: p.createTable({
    id: p.string(),
    tokenId: p.bigint(),
    chainId: p.int(),
    pointsEarned: p.bigint(),
    pointsClaimed: p.bigint(),
    pointsSpent: p.bigint(),
    lastUpdated: p.bigint(),
  }),
}));
