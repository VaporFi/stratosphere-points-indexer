import { ponder } from "@/generated";
import { getOrCreateUserData, queryQuote, getTokenId } from "./helpers";
import {
  BIGINT_HUNDRED_THOUSAND,
  BIGINT_ONE,
  BIGINT_TEN_THOUSAND,
  BIGINT_THOUSAND,
  MINIMUM_POINTS,
  assets,
  pointsMap,
} from "./config/constants";

ponder.on("Stratosphere:Transfer", async ({ event, context }) => {
  const { Points } = context.db;
  const { to: userAddress, tokenId } = event.args;
  const { hash } = event.transaction;

  await getOrCreateUserData(context, tokenId, userAddress);

  await Points.create({
    id: hash,
    data: {
      userDataId: `${userAddress}-${context.network.chainId}`,
      userHistoryId: `${userAddress}-${context.network.chainId}`,
      pointsSource: "stratosphere_enrollment",
      points: pointsMap.Enrollment,
      chainId: context.network.chainId,
      timestamp: event.block.timestamp,
    },
  });
});

ponder.on("LiquidMining:Deposit", async ({ event, context }) => {
  const { Points, UserHistory, LiquidMining } = context.db;
  const { hash } = event.transaction;
  const { seasonId, user: userAddress, amount } = event.args;
  const tokenId = await getTokenId(userAddress, context);

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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: `liquid_mining_first_wallet_season_${Number(seasonId)}`,
        points: pointsMap.FirstWalletInVPNDLM,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });
  }

  const userData = await getOrCreateUserData(context, tokenId, userAddress);
  if (userData.LMSeasons.length === 0) {
    await Points.create({
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "liquid-mining_first_deposit",
        points: pointsMap.FirstDepositInVPNDLM,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await Points.create({
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "liquid-mining_one_season",
        points: pointsMap.OneSeasonVPNDLMLock,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
      data: {
        LMSeasons: [seasonId],
        LMOneSeasonPointsClaimed: true,
      },
    });
  }

  if (!userData.LMSeasons.includes(seasonId)) {
    await UserHistory.update({
      id: userAddress,
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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "liquid-mining_three_seasons",
        points: pointsMap.ThreeSeasonVPNDLMLock,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
      data: {
        LMThreeSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 6 && !userData.LMSixSeasonsPointsClaimed) {
    await Points.create({
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "liquid-mining_six_seasons",
        points: pointsMap.SixSeasonVPNDLMLock,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
      data: {
        LMSixSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 12 && !userData.LMOneYearPointsClaimed) {
    await Points.create({
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "liquid-mining_twelve_seasons",
        points: pointsMap.OneYearVPNDLMLock,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
      data: {
        LMOneYearPointsClaimed: true,
      },
    });
  }
});

ponder.on("VapeStaking:Deposit", async ({ event, context }) => {
  const { Points, UserHistory, VapeStaking } = context.db;
  const { hash } = event.transaction;
  const { user: userAddress } = event.args;
  const tokenId = await getTokenId(userAddress, context);

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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "vape-staking_first_wallet",
        points: pointsMap.FirstWalletInVAPELM,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });
  }

  const userData = await getOrCreateUserData(context, tokenId, userAddress);

  if (!userData.depositInVS) {
    await Points.create({
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "vape-staking_first_deposit",
        points: pointsMap.FirstDepositInVAPELM,
        chainId: context.network.chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
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

  const tokenId = await getTokenId(userAddress, context);

  if (tokenId.toString() === "0") {
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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "dex-aggregator_swap",
        points: usdValueOfTrade,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "dex-aggregator_1k_swaps",
        points: pointsMap.ThousandSwaps,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "dex-aggregator_10k_swaps",
        points: pointsMap.TenThousandSwaps,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
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
      id: hash,
      data: {
        userDataId: `${userAddress}-${context.network.chainId}`,
        userHistoryId: `${userAddress}-${context.network.chainId}`,
        pointsSource: "dex-aggregator_100k_swaps",
        points: pointsMap.HundredThousandSwaps,
        chainId: chainId,
        timestamp: event.block.timestamp,
      },
    });

    await UserHistory.update({
      id: userAddress,
      data: {
        first100kSwaps: true,
      },
    });
  }
});
