import { type Context } from "@/generated";
import {
  QueryWithAmountIn,
  Quote,
  TokenIdData,
  UserHistory,
  UserLMData,
  UserVapeStakingData,
} from "./types";
import { StratosphereAbi } from "../abis/StratosphereAbi";
import {
  addresses,
  assets,
  BIGINT_ONE,
  BIGINT_ZERO,
  deployedBlockTimestamps,
  pointsMap,
} from "./config/constants";
import axios from "axios";
import {
  userDataTable,
  userHistoryTable,
  liquidMiningTable,
  vapeStakingTable,
  tokenIdDataTable,
  tokenIdDataWeeklyTable,
  walletsPerTierTable,
  allProtocolsTable,
  pointsTable,
} from "../ponder.schema";

/**
 * Calculates the daily ID based on a given timestamp and the deployed block timestamp of the Stratosphere contract.
 * @param timestamp - The timestamp for which the daily ID needs to be calculated.
 * @returns A bigint representing the calculated daily ID.
 */
export function getDailyID(
  timestamp: bigint,
  deployedBlockTimestamp: bigint
): bigint {
  let dailyID = (timestamp - deployedBlockTimestamp) / 86400n;
  return dailyID + 1n;
}

/**
 * Calculates the weekly ID based on a given timestamp and the deployed block timestamp of the Stratosphere contract.
 * @param timestamp - The timestamp for which the weekly ID needs to be calculated.
 * @returns A bigint representing the calculated weekly ID.
 */
export function getWeeklyID(
  timestamp: bigint,
  deployedBlockTimestamp: bigint
): bigint {
  let weeklyID = (timestamp - deployedBlockTimestamp) / 604800n;
  return weeklyID + 1n;
}

/**
 * Calculates the monthly ID based on a given timestamp and the deployed block timestamp of the Stratosphere contract.
 * @param timestamp - The timestamp for which the monthly ID needs to be calculated.
 * @returns A bigint representing the calculated monthly ID.
 */

export function getMonthlyID(
  timestamp: bigint,
  deployedBlockTimestamp: bigint
): bigint {
  let monthlyID = (timestamp - deployedBlockTimestamp) / 2592000n;
  return monthlyID + 1n;
}

export const handleChainFirstWallet = async (
  context: Context,
  chainId: number,
  userAddressLowerCase: string,
  userData: any,
  event: any
): Promise<UserHistory> => {
  let { db } = context;
  let allProtocols = await db.find(allProtocolsTable, { id: "protocols" });
  if (!allProtocols) {
    allProtocols = await db.insert(allProtocolsTable).values({
      id: "protocols",
      firstWallet: userAddressLowerCase,
    });
    await db.insert(pointsTable).values({
      id: `${userAddressLowerCase}-chain-first-wallet`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "chain_first_wallet",
      points: pointsMap.ChainFirstWallet,
      chainId: chainId,
      timestamp: event?.block?.timestamp,
    });

    userData = await db
      .update(userHistoryTable, { id: userData.id })
      .set((row) => ({
        chainFirstWallet: true,
      }));
  }
  return userData;
};

/**
 * Retrieves or creates user data based on the provided parameters.
 * @param context - The context object containing the database connection.
 * @param tokenId - The ID of the token associated with the user.
 * @param address - The user's address for which the data needs to be retrieved or created.
 * @returns A Promise resolving to the user data (UserHistory).
 */
export async function getOrCreateUserData(
  context: Context,
  tokenId: bigint,
  address: string
): Promise<UserHistory> {
  const { db } = context;
  const { chainId } = context.network;

  // Attempt to find existing user data
  let userHistory = await db.find(userHistoryTable, {
    id: `${address}-${chainId}`,
  });

  // Retrieve the main wallet associated with the provided tokenId
  let mainWallet = await getTokenIdOwner(tokenId, context);

  // If user data does not exist, create a new entry
  if (!userHistory) {
    userHistory = await db.insert(userHistoryTable).values({
      id: `${address}-${chainId}`,
      LMSeasons: [],
      depositInVS: false,
      LMOneSeasonPointsClaimed: false,
      LMThreeSeasonsPointsClaimed: false,
      LMSixSeasonsPointsClaimed: false,
      LMOneYearPointsClaimed: false,
      usdValueOfSwaps: BIGINT_ZERO,
      swaps: BIGINT_ZERO,
      first1kSwaps: false,
      first10kSwaps: false,
      first100kSwaps: false,
      chainId: chainId,
      firstWalletInVPNDLM: false,
      firstSwap: false,
      firstWalletInVAPELM: false,
      chainFirstWallet: false,
    });

    await db.insert(userDataTable).values({
      id: `${address}-${chainId}`,
      linkedToTokenId: tokenId,
      isMainWallet: address === mainWallet,
      chainId: BigInt(chainId),
    });
  }

  return userHistory;
}

/**
 * Queries the quote for a given set of parameters.
 * @param quoteParams - The parameters for the quote.
 * @param context - The context object containing the client and network information.
 * @returns A Promise resolving to the USD value of the trade (bigint).
 */
export async function queryQuote(
  quoteParams: QueryWithAmountIn,
  context: Context,
  blockNumber: bigint,
  aggregatorAddress: `0x${string}`
): Promise<bigint> {
  const { client, network, contracts } = context;

  let quote: Quote = { amounts: [], adapters: [], path: [], gasEstimate: 0n };

  while (quoteParams.maxSteps > BIGINT_ZERO) {
    try {
      quote = await client.readContract({
        abi: contracts.DexAggregator.abi,
        address: aggregatorAddress,
        functionName: "findBestPath",
        args: [
          quoteParams.amountIn,
          quoteParams.tokenIn,
          assets[network.name].USDC as `0x${string}`,
          quoteParams.maxSteps,
        ],
        blockNumber: blockNumber,
      });

      if (quote.amounts.slice(-1)[0] !== BIGINT_ZERO) {
        break;
      }
    } catch (e) {
      quoteParams.maxSteps -= BIGINT_ONE;
      continue;
    }
  }

  const usdValueOfTrade = quote.amounts.slice(-1)[0] ?? BIGINT_ZERO;

  return usdValueOfTrade;
}

/**
 * Retrieves the token ID for a given address.
 * @param address - The address for which the token ID needs to be retrieved.
 * @param context - The context object containing the client and network information.
 * @returns A Promise resolving to the token ID (bigint).
 */
export async function getTokenId(
  address: `0x${string}`,
  context: Context
): Promise<bigint> {
  const { client, network } = context;

  let tokenId = 0n;
  let revertedAddresses = [];

  try {
    tokenId = await client.readContract({
      abi: StratosphereAbi,
      address: addresses.Stratosphere![network.name] as `0x${string}`,
      functionName: "tokenIdOf",
      args: [address],
    });
  } catch (e) {
    revertedAddresses.push(address);
  }

  if (revertedAddresses.length > 0) {
    console.log(revertedAddresses);
  }
  return tokenId;
}

/**
 * Retrieves the owner of a given token ID.
 * @param tokenId - The token ID for which the owner needs to be retrieved.
 * @param context - The context object containing the client and network information.
 * @returns A Promise resolving to the owner address (`0x${string}`).
 */
export async function getTokenIdOwner(
  tokenId: bigint,
  context: Context
): Promise<`0x${string}`> {
  const { client, network } = context;

  const tokenIdOwner = await client.readContract({
    abi: StratosphereAbi,
    address: addresses.Stratosphere![network.name] as `0x${string}`,
    functionName: "ownerOf",
    args: [tokenId],
  });

  return tokenIdOwner;
}

/**
 * Queries the liquid mining data for a given user.
 * @param user - The user for which the liquid mining data needs to be queried.
 * @returns A Promise resolving to an array of UserLMData objects.
 */
export async function queryLiquidMiningData(
  user: string
): Promise<UserLMData[]> {
  let response = await axios
    .post("https://api.thegraph.com/subgraphs/name/vaporfi/liquid-mining", {
      query: `query UserQuery {
          users(where: {id_contains: "${user}"}) {
            seasonId
            isMainWallet
            linkedToTokenId
            id
          }
        }`,
    })
    .then((res) => {
      return res.data.data.users;
    });

  return response;
}

/**
 * Queries the vape staking data for a given user.
 * @param user - The user for which the vape staking data needs to be queried.
 * @returns A Promise resolving to an array of UserVapeStakingData objects.
 */
export async function queryVapeStakingData(
  user: string
): Promise<UserVapeStakingData[]> {
  let response = await axios
    .post("https://api.thegraph.com/subgraphs/name/vaporfi/vape-staking", {
      query: `query UserQuery {
        users(where: {id_contains: "${user}"}) {
          id
        }
      }`,
    })
    .then((res) => {
      return res.data.data.users;
    });

  return response;
}

/**
 * Retrieves or updates the TokenIdData for a given tokenId and timestamp.
 * If the TokenIdData does not exist, it will be created.
 * If the monthly TokenIdData does not exist, it will be created.
 * Updates the pointsEarned, pointsClaimed, and pointsSpent values for both the TokenIdData and monthly TokenIdData.
 * @notice The monthly data is for helping reset points
 * @param context - The execution context.
 * @param tokenId - The tokenId.
 * @param timestamp - The timestamp.
 * @param pointsEarned - The points earned (default: 0).
 * @param pointsClaimed - The points claimed (default: 0).
 * @param pointsSpent - The points spent (default: 0).
 * @returns The updated TokenIdData.
 */
export async function getOrUpdateTokenIdData(
  context: Context,
  tokenId: bigint,
  timestamp: bigint,
  {
    pointsEarned = BIGINT_ZERO,
    pointsClaimed = BIGINT_ZERO,
    pointsSpent = BIGINT_ZERO,
  }: Partial<{
    pointsEarned: bigint;
    pointsClaimed: bigint;
    pointsSpent: bigint;
  }> = {}
): Promise<TokenIdData> {
  const { db } = context;
  const { chainId, name } = context.network;

  const deployedBlockTimestamp = deployedBlockTimestamps[name].Stratosphere;
  const weeklyId = `${tokenId}-${chainId}-${getWeeklyID(
    timestamp,
    deployedBlockTimestamp
  )}`;

  let tokenIdData = await db.find(tokenIdDataTable, {
    id: `${tokenId}-${chainId}`,
  });
  let tokenIdDataWeekly = await db.find(tokenIdDataWeeklyTable, {
    id: weeklyId,
  });

  if (!tokenIdData) {
    tokenIdData = await db.insert(tokenIdDataTable).values({
      id: `${tokenId}-${chainId}`,
      tokenId,
      chainId,
      pointsEarned: BIGINT_ZERO,
      pointsClaimed: BIGINT_ZERO,
      pointsSpent: BIGINT_ZERO,
      lastUpdated: timestamp,
    });
  }

  if (!tokenIdDataWeekly) {
    tokenIdDataWeekly = await db.insert(tokenIdDataWeeklyTable).values({
      id: weeklyId,
      tokenId,
      chainId: chainId,
      pointsEarned: BIGINT_ZERO,
      pointsClaimed: BIGINT_ZERO,
      pointsSpent: BIGINT_ZERO,
      lastUpdated: timestamp,
    });
  }

  tokenIdData = await db
    .update(tokenIdDataTable, { id: `${tokenId}-${chainId}` })
    .set((row) => ({
      pointsEarned: row.pointsEarned + pointsEarned,
      pointsClaimed: row.pointsClaimed + pointsClaimed,
      pointsSpent: row.pointsSpent + pointsSpent,
      lastUpdated: timestamp,
    }));

  tokenIdDataWeekly = await db
    .update(tokenIdDataWeeklyTable, { id: weeklyId })
    .set((row) => ({
      pointsEarned: row.pointsEarned + pointsEarned,
      pointsClaimed: row.pointsClaimed + pointsClaimed,
      pointsSpent: row.pointsSpent + pointsSpent,
      lastUpdated: timestamp,
    }));

  return tokenIdData;
}

export async function getOrUpdateWalletsPerTier(
  context: Context,
  tierId: bigint,
  userAddress: string
): Promise<any> {
  const { db } = context;
  const { chainId } = context.network;

  const id = `${tierId}-${chainId}`;

  let walletsPerTier = await db.find(walletsPerTierTable, { id });

  if (!walletsPerTier) {
    walletsPerTier = await db.insert(walletsPerTierTable).values({
      id,
      wallets: [userAddress],
    });
  }

  if (!walletsPerTier.wallets.includes(userAddress)) {
    walletsPerTier.wallets.push(userAddress);
    walletsPerTier = await db
      .update(walletsPerTierTable, { id })
      .set((row) => ({
        wallets: row.wallets.concat(userAddress),
      }));
  }

  return walletsPerTier;
}
