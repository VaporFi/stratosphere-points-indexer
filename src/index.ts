import { ponder } from "ponder:registry";
import {
  getOrCreateUserData,
  queryQuote,
  getTokenId,
  getOrUpdateTokenIdData,
  handleChainFirstWallet,
  getOrUpdateWalletsPerTier,
} from "./helpers";
import {
  BIGINT_HUNDRED_THOUSAND,
  BIGINT_ONE,
  BIGINT_TEN_THOUSAND,
  BIGINT_THOUSAND,
  BIGINT_THREE,
  BIGINT_ZERO,
  MINIMUM_POINTS,
  assets,
  chainId,
  pointsMap,
} from "./config/constants";
import { Address } from "viem";

import schema, { pointsTable } from "ponder:schema";

ponder.on("Stratosphere:Transfer", async ({ event, context }) => {
  const { db } = context;
  const { to: userAddress, tokenId } = event.args;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const timestamp = event.block.timestamp;
  const userAddressLowerCase = userAddress?.toLowerCase();
  await getOrCreateUserData(context, tokenId, userAddressLowerCase);

  await db.insert(schema.pointsTable).values({
    id: `${hash}-stratosphere-enrollment`,
    userDataId: `${userAddressLowerCase}-${chainId}`,
    userHistoryId: `${userAddressLowerCase}-${chainId}`,
    pointsSource: "stratosphere_enrollment",
    points: pointsMap.Enrollment,
    chainId: chainId,
    timestamp: timestamp,
  });

  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsEarned: pointsMap.Enrollment,
  });

  await getOrUpdateWalletsPerTier(context, 0n, userAddressLowerCase);
});

ponder.on("LiquidMining:Deposit", async ({ event, context }) => {
  const { db } = context;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const { seasonId, user: userAddress, amount } = event.args;
  const userAddressLowerCase = userAddress?.toLowerCase();
  const tokenId = await getTokenId(userAddressLowerCase as Address, context);
  const timestamp = event.block.timestamp;

  if (tokenId === BIGINT_ZERO) {
    return;
  }

  let userData = await getOrCreateUserData(
    context,
    tokenId,
    userAddressLowerCase
  );
  userData = await handleChainFirstWallet(
    context,
    chainId,
    userAddressLowerCase,
    userData,
    event
  );

  let liquidMiningData = await db.find(schema.liquidMiningTable, {
    id: seasonId,
  });

  if (!liquidMiningData) {
    liquidMiningData = await db.insert(schema.liquidMiningTable).values({
      id: seasonId,
      firstWallet: userAddressLowerCase,
    });

    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-first-wallet`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: `liquid_mining_first_wallet_season_${Number(seasonId)}`,
      points: pointsMap.FirstWalletInVPNDLM,
      chainId: chainId,
      timestamp: timestamp,
    });

    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        firstWalletInVPNDLM: true,
      });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVPNDLM,
    });
  }

  if (userData.LMSeasons.length === 0) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-first-deposit`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "liquid_mining_first_deposit",
      points: pointsMap.FirstDepositInVPNDLM,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstDepositInVPNDLM,
    });

    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-one-season`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "liquid_mining_one_season",
      points: pointsMap.OneSeasonVPNDLMLock,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneSeasonVPNDLMLock,
    });

    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        LMSeasons: [seasonId],
        LMOneSeasonPointsClaimed: true,
      });
  }

  if (!userData.LMSeasons.includes(seasonId)) {
    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        LMSeasons: [...userData.LMSeasons, seasonId],
      });
  }

  if (
    userData.LMSeasons.length === 3 &&
    !userData.LMThreeSeasonsPointsClaimed
  ) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-three-seasons`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "liquid_mining_three_seasons",
      points: pointsMap.ThreeSeasonVPNDLMLock,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThreeSeasonVPNDLMLock,
    });

    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        LMThreeSeasonsPointsClaimed: true,
      });
  }

  if (userData.LMSeasons.length === 6 && !userData.LMSixSeasonsPointsClaimed) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-six-seasons`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "liquid_mining_six_seasons",
      points: pointsMap.SixSeasonVPNDLMLock,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.SixSeasonVPNDLMLock,
    });

    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        LMSixSeasonsPointsClaimed: true,
      });
  }

  if (userData.LMSeasons.length === 12 && !userData.LMOneYearPointsClaimed) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-liquid-mining-twelve-seasons`,
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
      pointsSource: "liquid_mining_twelve_seasons",
      points: pointsMap.OneYearVPNDLMLock,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneYearVPNDLMLock,
    });

    userData = await db
      .update(schema.userHistoryTable, {
        id: `${userAddressLowerCase}-${chainId}`,
      })
      .set({
        LMOneYearPointsClaimed: true,
      });
  }
});

ponder.on("VapeStaking:Deposit", async ({ event, context }) => {
  const { db } = context;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const { user: userAddress } = event.args;
  const userAddressLowerCase = userAddress?.toLowerCase() as Address;
  const tokenId = await getTokenId(userAddressLowerCase, context);
  const timestamp = event.block.timestamp;

  if (tokenId === BIGINT_ZERO) {
    return;
  }
  let userData = await getOrCreateUserData(
    context,
    tokenId,
    userAddressLowerCase
  );
  userData = await handleChainFirstWallet(
    context,
    chainId,
    userAddressLowerCase,
    userData,
    event
  );

  let vapeStakingData = await db.find(schema.vapeStakingTable, {
    id: "vape-staking",
  });

  if (!vapeStakingData) {
    vapeStakingData = await db.insert(schema.vapeStakingTable).values({
      id: "vape-staking",
      firstWallet: userAddressLowerCase,
      txnHash: hash,
    });

    await db.insert(schema.pointsTable).values({
      id: `${hash}-vape-staking-first-wallet`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "vape_staking_first_wallet",
      points: pointsMap.FirstWalletInVAPELM,
      chainId: chainId,
      timestamp: timestamp,
    });

    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({
        firstWalletInVAPELM: true,
      });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVAPELM,
    });
  }

  if (!userData.depositInVS) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-vape-staking-first-deposit`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "vape_staking_first_deposit",
      points: pointsMap.FirstDepositInVAPELM,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstDepositInVAPELM,
    });

    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({
        depositInVS: true,
      });
  }
});

ponder.on("DexAggregator:RouterSwap", async ({ event, context }) => {
  const { db } = context;
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
    blockNumber,
    event.log.address
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
    userData,
    event
  );
  // @dev: We are trying maxSteps till 3, which includes all the common paths
  // For reference: https://github.com/VaporFi/dex-aggregator-v2/blob/cad6410a4cc429df532720bfee209852dbd97be4/src/facets/LegacyRouterFacet.sol#L332
  // If we are unable to find a path, usdValueOfTrade is Zero and we don't want to index that
  if (usdValueOfTrade >= MINIMUM_POINTS) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-dex-aggregator-swap`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "dex_aggregator_swap",
      points: usdValueOfTrade,
      chainId: chainId,
      timestamp: event.block.timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: usdValueOfTrade,
    });
  }

  if (!userData.firstSwap) {
    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({ firstSwap: true });

    await db.insert(schema.pointsTable).values({
      id: `${hash}-dex-aggregator-first-swap`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "dex_aggregator_first_swap",
      points: pointsMap.FirstSwap,
      chainId: chainId,
      timestamp: timestamp,
    });
  }

  // Update total swaps and total USD value of swaps
  userData = await db.update(schema.userHistoryTable, { id: userData.id }).set({
    usdValueOfSwaps: userData.usdValueOfSwaps + usdValueOfTrade,
    swaps: userData.swaps + BIGINT_ONE,
  });

  // Check for first $1k, $10k, $100k swaps and assign points accordingly
  if (
    userData.usdValueOfSwaps >= BIGINT_THOUSAND * MINIMUM_POINTS &&
    !userData.first1kSwaps
  ) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-dex-aggregator-1k-swaps`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "dex_aggregator_1k_swaps",
      points: pointsMap.ThousandSwaps,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThousandSwaps,
    });

    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({
        first1kSwaps: true,
      });
  }

  if (
    userData.usdValueOfSwaps >= BIGINT_TEN_THOUSAND * MINIMUM_POINTS &&
    !userData.first10kSwaps
  ) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-dex-aggregator-10k-swaps`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "dex_aggregator_10k_swaps",
      points: pointsMap.TenThousandSwaps,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.TenThousandSwaps,
    });

    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({
        first10kSwaps: true,
      });
  }

  if (
    userData.usdValueOfSwaps >= BIGINT_HUNDRED_THOUSAND * MINIMUM_POINTS &&
    !userData.first100kSwaps
  ) {
    await db.insert(schema.pointsTable).values({
      id: `${hash}-dex-aggregator-100k-swaps`,
      userDataId: userData.id,
      userHistoryId: userData.id,
      pointsSource: "dex_aggregator_100k_swaps",
      points: pointsMap.HundredThousandSwaps,
      chainId: chainId,
      timestamp: timestamp,
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.HundredThousandSwaps,
    });

    userData = await db
      .update(schema.userHistoryTable, { id: userData.id })
      .set({
        first100kSwaps: true,
      });
  }
});

ponder.on("RewardsController:ClaimPoints", async ({ event, context }) => {
  const { tokenId, points } = event.args;
  const timestamp = event.block.timestamp;
  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsClaimed: points,
  });

  const tier = await context.client.readContract({
    abi: context.contracts.RewardsController.abi,
    address: context.contracts.RewardsController.address as `0x${string}`,
    functionName: "tierOf",
    args: [tokenId],
  });

  await getOrUpdateWalletsPerTier(context, tier, event.args.member);
});
