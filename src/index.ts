import { ponder } from "@/generated";
import {
  getOrCreateUserData,
  queryQuote,
  getTokenId,
  getOrUpdateTokenIdData,
  handleChainFirstWallet,
  handleDexSwap,
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
  const { Points, UserHistory, LiquidMining } = context.db;
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
    userData
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
  userData = await handleChainFirstWallet(
    context,
    chainId,
    userAddressLowerCase,
    userData
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
  return handleDexSwap(context, event);
});

ponder.on("DexAggregatorV2:RouterSwap", async ({ event, context }) => {
  return handleDexSwap(context, event);
});

ponder.on("RewardsController:ClaimPoints", async ({ event, context }) => {
  const { tokenId, points } = event.args;
  const timestamp = event.block.timestamp;
  await getOrUpdateTokenIdData(context, tokenId, timestamp, {
    pointsClaimed: points,
  });
});
