import { ponder } from "@/generated";
import {
  getOrCreateUserData,
  queryQuote,
  getTokenId,
  getOrUpdateTokenIdData,
} from "./helpers";
import {
  BIGINT_HUNDRED_THOUSAND,
  BIGINT_ONE,
  BIGINT_TEN_THOUSAND,
  BIGINT_THOUSAND,
  BIGINT_ZERO,
  MINIMUM_POINTS,
  assets,
  pointsMap,
} from "./config/constants";
import { get } from "http";

ponder.on("Stratosphere:Transfer", async ({ event, context }) => {
  const { Points } = context.db;
  const { to: userAddress, tokenId } = event.args;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const timestamp = event.block.timestamp;

  await getOrCreateUserData(context, tokenId, userAddress);

  await Points.create({
    id: `${hash}-stratosphere-enrollment`,
    data: {
      userDataId: `${userAddress}-${chainId}`,
      userHistoryId: `${userAddress}-${chainId}`,
      pointsSource: "stratosphere_enrollment",
      points: pointsMap.Enrollment,
      chainId: chainId,
      timestamp: timestamp,
    },
  });

  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsEarned: pointsMap.Enrollment,
  });
});

ponder.on("LiquidMining:Deposit", async ({ event, context }) => {
  const { Points, UserHistory, LiquidMining, TokenIdData } = context.db;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const { seasonId, user: userAddress, amount } = event.args;
  const tokenId = await getTokenId(userAddress, context);
  const timestamp = event.block.timestamp;

  if (tokenId === BIGINT_ZERO) {
    return;
  }

  let liquidMiningData = await LiquidMining.findUnique({
    id: seasonId,
  });

  if (!liquidMiningData) {
    liquidMiningData = await LiquidMining.create({
      id: seasonId,
      data: {
        firstWallet: userAddress,
      },
    });

    await Points.create({
      id: `${hash}-liquid-mining-first-wallet`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: `liquid_mining_first_wallet_season_${Number(seasonId)}`,
        points: pointsMap.FirstWalletInVPNDLM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVPNDLM,
    });
  }

  const userData = await getOrCreateUserData(context, tokenId, userAddress);

  if (userData.LMSeasons.length === 0) {
    await Points.create({
      id: `${hash}-liquid-mining-first-deposit`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "liquid_mining_first_deposit",
        points: pointsMap.FirstDepositInVPNDLM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstDepositInVPNDLM,
    });

    await Points.create({
      id: `${hash}-liquid-mining-one-season`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "liquid_mining_one_season",
        points: pointsMap.OneSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneSeasonVPNDLMLock,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        LMSeasons: [seasonId],
        LMOneSeasonPointsClaimed: true,
      },
    });
  }

  if (!userData.LMSeasons.includes(seasonId)) {
    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: ({ current }) => ({
        LMSeasons: [...current.LMSeasons, seasonId],
      }),
    });
  }

  if (
    userData.LMSeasons.length === 3 &&
    !userData.LMThreeSeasonsPointsClaimed
  ) {
    await Points.create({
      id: `${hash}-liquid-mining-three-seasons`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "liquid_mining_three_seasons",
        points: pointsMap.ThreeSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThreeSeasonVPNDLMLock,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        LMThreeSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 6 && !userData.LMSixSeasonsPointsClaimed) {
    await Points.create({
      id: `${hash}-liquid-mining-six-seasons`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "liquid_mining_six_seasons",
        points: pointsMap.SixSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.SixSeasonVPNDLMLock,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        LMSixSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 12 && !userData.LMOneYearPointsClaimed) {
    await Points.create({
      id: `${hash}-liquid-mining-twelve-seasons`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "liquid_mining_twelve_seasons",
        points: pointsMap.OneYearVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneYearVPNDLMLock,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        LMOneYearPointsClaimed: true,
      },
    });
  }
});

ponder.on("VapeStaking:Deposit", async ({ event, context }) => {
  const { Points, UserHistory, VapeStaking } = context.db;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const { user: userAddress } = event.args;
  const tokenId = await getTokenId(userAddress, context);
  const timestamp = event.block.timestamp;

  if (tokenId === BIGINT_ZERO) {
    return;
  }

  let vapeStakingData = await VapeStaking.findUnique({
    id: "vape-staking",
  });

  if (!vapeStakingData) {
    vapeStakingData = await VapeStaking.create({
      id: "vape-staking",
      data: {
        firstWallet: userAddress,
        txnHash: hash,
      },
    });

    await Points.create({
      id: `${hash}-vape-staking-first-wallet`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "vape_staking_first_wallet",
        points: pointsMap.FirstWalletInVAPELM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVAPELM,
    });
  }

  const userData = await getOrCreateUserData(context, tokenId, userAddress);

  if (!userData.depositInVS) {
    await Points.create({
      id: `${hash}-vape-staking-first-deposit`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "vape_staking_first_deposit",
        points: pointsMap.FirstDepositInVAPELM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstDepositInVAPELM,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        depositInVS: true,
      },
    });
  }
});

ponder.on("DexAggregator:RouterSwap", async ({ event, context }) => {
  const { Points, UserHistory } = context.db;
  const { tokenOut: tokenIn, amountOut: amountIn } = event.args;
  const { from: userAddress, hash } = event.transaction;
  const { chainId, name } = context.network;
  const tokenOut = assets[name].USDC as `0x${string}`;
  const timestamp = event.block.timestamp;

  const tokenId = await getTokenId(userAddress, context);

  if (tokenId === BIGINT_ZERO) {
    return;
  }

  const usdValueOfTrade = await queryQuote(
    { amountIn, tokenIn, tokenOut, maxSteps: BIGINT_ONE },
    context
  );

  // @dev: We are trying maxSteps till 3, which includes all the common paths
  // For reference: https://github.com/VaporFi/dex-aggregator-v2/blob/cad6410a4cc429df532720bfee209852dbd97be4/src/facets/LegacyRouterFacet.sol#L332
  // If we are unable to find a path, usdValueOfTrade is Zero and we don't want to index that
  if (usdValueOfTrade >= MINIMUM_POINTS) {
    await Points.create({
      id: `${hash}-dex-aggregator-swap`,
      data: {
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "dex_aggregator_swap",
        points: usdValueOfTrade,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: usdValueOfTrade,
    });
  }

  const userData = await getOrCreateUserData(context, tokenId, userAddress);

  // Update total swaps and total USD value of swaps
  await UserHistory.update({
    id: `${userAddress}-${chainId}`,
    data: {
      usdValueOfSwaps: userData.usdValueOfSwaps + usdValueOfTrade,
      swaps: userData.swaps + 1n,
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
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "dex_aggregator_1k_swaps",
        points: pointsMap.ThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThousandSwaps,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
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
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "dex_aggregator_10k_swaps",
        points: pointsMap.TenThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.TenThousandSwaps,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
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
        userDataId: `${userAddress}-${chainId}`,
        userHistoryId: `${userAddress}-${chainId}`,
        pointsSource: "dex_aggregator_100k_swaps",
        points: pointsMap.HundredThousandSwaps,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.HundredThousandSwaps,
    });

    await UserHistory.update({
      id: `${userAddress}-${chainId}`,
      data: {
        first100kSwaps: true,
      },
    });
  }
});

ponder.on("RewardsController:ClaimPoints", async ({ event, context }) => {
  const { tokenId, points } = event.args;
  const timestamp = event.block.timestamp;
  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsClaimed: points,
  });
});
