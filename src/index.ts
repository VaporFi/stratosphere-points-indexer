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
  BIGINT_THREE,
  BIGINT_ZERO,
  MINIMUM_POINTS,
  assets,
  pointsMap,
} from "./config/constants";
import { Address } from "viem";

ponder.on("Stratosphere:Transfer", async ({ event, context }) => {
  const { Points } = context.db;
  const { to: userAddress, tokenId } = event.args;
  const { hash } = event.transaction;
  const { chainId } = context.network;
  const timestamp = event.block.timestamp;
  const userAddressLowerCase = userAddress?.toLowerCase();
  await getOrCreateUserData(context, tokenId, userAddressLowerCase);

  await Points.create({
    id: `${hash}-stratosphere-enrollment`,
    data: {
      userDataId: `${userAddressLowerCase}-${chainId}`,
      userHistoryId: `${userAddressLowerCase}-${chainId}`,
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

  let liquidMiningData = await LiquidMining.findUnique({
    id: seasonId,
  });

  if (!liquidMiningData) {
    liquidMiningData = await LiquidMining.create({
      id: seasonId,
      data: {
        firstWallet: userAddressLowerCase,
      },
    });

    await Points.create({
      id: `${hash}-liquid-mining-first-wallet`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: `liquid_mining_first_wallet_season_${Number(seasonId)}`,
        points: pointsMap.FirstWalletInVPNDLM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: { firstWalletInVPNDLM: true },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVPNDLM,
    });
  }

  if (userData.LMSeasons.length === 0) {
    await Points.create({
      id: `${hash}-liquid-mining-first-deposit`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
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
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "liquid_mining_one_season",
        points: pointsMap.OneSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneSeasonVPNDLMLock,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        LMSeasons: [seasonId],
        LMOneSeasonPointsClaimed: true,
      },
    });
  }

  if (!userData.LMSeasons.includes(seasonId)) {
    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
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
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "liquid_mining_three_seasons",
        points: pointsMap.ThreeSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.ThreeSeasonVPNDLMLock,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        LMThreeSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 6 && !userData.LMSixSeasonsPointsClaimed) {
    await Points.create({
      id: `${hash}-liquid-mining-six-seasons`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "liquid_mining_six_seasons",
        points: pointsMap.SixSeasonVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.SixSeasonVPNDLMLock,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: {
        LMSixSeasonsPointsClaimed: true,
      },
    });
  }

  if (userData.LMSeasons.length === 12 && !userData.LMOneYearPointsClaimed) {
    await Points.create({
      id: `${hash}-liquid-mining-twelve-seasons`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "liquid_mining_twelve_seasons",
        points: pointsMap.OneYearVPNDLMLock,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.OneYearVPNDLMLock,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
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

  let vapeStakingData = await VapeStaking.findUnique({
    id: "vape-staking",
  });

  if (!vapeStakingData) {
    vapeStakingData = await VapeStaking.create({
      id: "vape-staking",
      data: {
        firstWallet: userAddressLowerCase,
        txnHash: hash,
      },
    });

    await Points.create({
      id: `${hash}-vape-staking-first-wallet`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "vape_staking_first_wallet",
        points: pointsMap.FirstWalletInVAPELM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });
    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
      data: { firstWalletInVAPELM: true },
    });
    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstWalletInVAPELM,
    });
  }

  if (!userData.depositInVS) {
    await Points.create({
      id: `${hash}-vape-staking-first-deposit`,
      data: {
        userDataId: `${userAddressLowerCase}-${chainId}`,
        userHistoryId: `${userAddressLowerCase}-${chainId}`,
        pointsSource: "vape_staking_first_deposit",
        points: pointsMap.FirstDepositInVAPELM,
        chainId: chainId,
        timestamp: timestamp,
      },
    });

    await getOrUpdateTokenIdData(context, tokenId, timestamp, {
      pointsEarned: pointsMap.FirstDepositInVAPELM,
    });

    userData = await UserHistory.update({
      id: `${userAddressLowerCase}-${chainId}`,
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
});

ponder.on("RewardsController:ClaimPoints", async ({ event, context }) => {
  const { tokenId, points } = event.args;
  const timestamp = event.block.timestamp;
  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsClaimed: points,
  });
});
