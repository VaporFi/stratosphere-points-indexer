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
  BIGINT_HUNDRED_THOUSAND,
  BIGINT_ONE,
  BIGINT_TEN_THOUSAND,
  BIGINT_THOUSAND,
  BIGINT_THREE,
  BIGINT_ZERO,
  deployedBlockTimestamps,
  MINIMUM_POINTS,
  pointsMap,
} from "./config/constants";
import axios from "axios";
import { Address } from "viem";

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
  userData: any
): Promise<UserHistory> => {
  const { AllProtocols, UserHistory } = context.db;
  let allProtocols = await AllProtocols.findUnique({ id: "protocols" });
  if (!allProtocols) {
    allProtocols = await AllProtocols.create({
      id: "protocols",
      data: { firstWallet: userAddressLowerCase },
    });
    return await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: { chainFirstWallet: true },
    });
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
  const { UserHistory, UserData } = context.db;
  const { chainId } = context.network;

  // Attempt to find existing user data
  let userHistory = await UserHistory.findUnique({
    id: `${address}-${chainId}`,
  });

  // Retrieve the main wallet associated with the provided tokenId
  let mainWallet = await getTokenIdOwner(tokenId, context);

  // If user data does not exist, create a new entry
  if (!userHistory) {
    userHistory = await UserHistory.create({
      id: `${address}-${chainId}`,
      data: {
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
      },
    });

    await UserData.create({
      id: `${address}-${chainId}`,
      data: {
        linkedToTokenId: tokenId,
        isMainWallet: address === mainWallet,
        chainId: chainId,
      },
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
  blockNumber: bigint
): Promise<bigint> {
  const { client, network, contracts } = context;

  let quote: Quote = { amounts: [], adapters: [], path: [], gasEstimate: 0n };

  while (quoteParams.maxSteps > BIGINT_ZERO) {
    try {
      quote = await client.readContract({
        abi: contracts.DexAggregator.abi,
        address: addresses.DexAggregator![network.name] as `0x${string}`,
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
  const { TokenIdData, TokenIdDataWeekly } = context.db;
  const { chainId, name } = context.network;

  const deployedBlockTimestamp = deployedBlockTimestamps[name].Stratosphere;
  const weeklyId = `${tokenId}-${chainId}-${getWeeklyID(
    timestamp,
    deployedBlockTimestamp
  )}`;

  let tokenIdData = await TokenIdData.findUnique({
    id: `${tokenId}-${chainId}`,
  });
  let tokenIdDataWeekly = await TokenIdDataWeekly.findUnique({ id: weeklyId });

  if (!tokenIdData) {
    tokenIdData = await TokenIdData.create({
      id: `${tokenId}-${chainId}`,
      data: {
        tokenId,
        chainId,
        pointsEarned: BIGINT_ZERO,
        pointsClaimed: BIGINT_ZERO,
        pointsSpent: BIGINT_ZERO,
        lastUpdated: timestamp,
      },
    });
  }

  if (!tokenIdDataWeekly) {
    tokenIdDataWeekly = await TokenIdDataWeekly.create({
      id: weeklyId,
      data: {
        tokenId,
        chainId,
        pointsEarned: BIGINT_ZERO,
        pointsClaimed: BIGINT_ZERO,
        pointsSpent: BIGINT_ZERO,
        lastUpdated: timestamp,
      },
    });
  }

  tokenIdData = await TokenIdData.update({
    id: `${tokenId}-${chainId}`,
    data: ({ current }) => ({
      pointsEarned: current.pointsEarned + pointsEarned,
      pointsClaimed: current.pointsClaimed + pointsClaimed,
      pointsSpent: current.pointsSpent + pointsSpent,
      lastUpdated: timestamp,
    }),
  });

  tokenIdDataWeekly = await TokenIdDataWeekly.update({
    id: weeklyId,
    data: ({ current }) => ({
      pointsEarned: current.pointsEarned + pointsEarned,
      pointsClaimed: current.pointsClaimed + pointsClaimed,
      pointsSpent: current.pointsSpent + pointsSpent,
      lastUpdated: timestamp,
    }),
  });

  return tokenIdData;
}

export const handleDexSwap = async (context: Context, event: any) => {
  const { Points, UserHistory } = context.db;
  const { tokenOut: tokenIn, amountOut: amountIn } = event.args;
  const { from: userAddress, hash } = event.transaction;
  const { chainId, name } = context.network;
  const tokenOut = assets[name].USDC as `0x${string}`;
  const timestamp = event.block.timestamp;
  const blockNumber = event.block.number;
  const userAddressLowerCase = userAddress?.toLowerCase() as Address;
  const tokenId = await getTokenId(userAddressLowerCase, context);

  if (tokenId === BIGINT_ZERO) {
    return;
  }

  const usdValueOfTrade = await queryQuote(
    { amountIn, tokenIn, tokenOut, maxSteps: BIGINT_THREE },
    context,
    blockNumber
  );

  let userData = await getOrCreateUserData(
    context,
    tokenId,
    userAddressLowerCase
  );
  userData = await handleChainFirstWallet(
    context,
    chainId,
    userAddressLowerCase,
    userData
  );
  // @dev: We are trying maxSteps till 3, which includes all the common paths
  // For reference: https://github.com/VaporFi/dex-aggregator-v2/blob/cad6410a4cc429df532720bfee209852dbd97be4/src/facets/LegacyRouterFacet.sol#L332
  // If we are unable to find a path, usdValueOfTrade is Zero and we don't want to index that
  if (usdValueOfTrade >= MINIMUM_POINTS) {
    await Points.create({
      id: `${hash}-dex-aggregator-swap`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "dex_aggregator_swap",
        points: usdValueOfTrade,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
    });

    if (!userData.firstSwap) {
      userData = await UserHistory.update({
        id: `${userAddressLowerCase}-${chainId}`,
        data: { firstSwap: true },
      });

      await Points.create({
        id: `${hash}-dex-aggregator-first-swap`,
        data: {
          userDataId: `${userAddressLowerCase}-${chainId}`,
          userHistoryId: `${userAddressLowerCase}-${chainId}`,
          pointsSource: "dex_aggregator_first_swap",
          points: pointsMap.FirstSwap,
          chainId: chainId,
          timestamp: timestamp,
        },
      });
    }

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: usdValueOfTrade,
    });
  }

  // Update total swaps and total USD value of swaps
  userData = await UserHistory.update({
    id: `${userAddressLowerCase}-${chainId}`,
    data: {
      usdValueOfSwaps: userData.usdValueOfSwaps + usdValueOfTrade,
      swaps: userData.swaps + BIGINT_ONE,
    },
  });

  // Check for first $1k, $10k, $100k swaps and assign points accordingly
  if (
    userData.usdValueOfSwaps + usdValueOfTrade >=
      BIGINT_THOUSAND * MINIMUM_POINTS &&
    !userData.first1kSwaps
  ) {
    await Points.create({
      id: `${hash}-dex-aggregator-1k-swaps`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "dex_aggregator_1k_swaps",
        points: pointsMap.ThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThousandSwaps,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        first1kSwaps: true,
      },
    });
  }

  if (
    userData.usdValueOfSwaps + usdValueOfTrade >=
      BIGINT_TEN_THOUSAND * MINIMUM_POINTS &&
    !userData.first10kSwaps
  ) {
    await Points.create({
      id: `${hash}-dex-aggregator-10k-swaps`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "dex_aggregator_10k_swaps",
        points: pointsMap.TenThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.TenThousandSwaps,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        first10kSwaps: true,
      },
    });
  }

  if (
    userData.usdValueOfSwaps + usdValueOfTrade >=
      BIGINT_HUNDRED_THOUSAND * MINIMUM_POINTS &&
    !userData.first100kSwaps
  ) {
    await Points.create({
      id: `${hash}-dex-aggregator-100k-swaps`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "dex_aggregator_100k_swaps",
        points: pointsMap.HundredThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.HundredThousandSwaps,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        first100kSwaps: true,
      },
    });
  }
};
