import { type Context } from "@/generated";

export interface QueryWithAmountIn {
  amountIn: bigint;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  maxSteps: bigint;
}

export interface Quote {
  amounts: readonly bigint[];
  adapters: readonly `0x${string}`[];
  path: readonly `0x${string}`[];
  gasEstimate: bigint;
}

export type Points = Context["db"]["Points"];

export interface UserLMData {
  id: string;
  isMainWallet: boolean;
  linkedToTokenId: string;
  seasonId: string;
  totalClaimed: string;
  totalDeposited: string;
  totalUnlocked: string;
  totalWithdrawn: string;
}

export interface UserResponseLM {
  data: {
    users: UserLMData[];
  };
}

export interface UserVapeStakingData {
  id: string;
}

export interface UserHistory {
  id: string;
  chainId: number;
  LMSeasons: bigint[];
  depositInVS: boolean;
  LMOneSeasonPointsClaimed: boolean;
  LMThreeSeasonsPointsClaimed: boolean;
  LMSixSeasonsPointsClaimed: boolean;
  LMOneYearPointsClaimed: boolean;
  usdValueOfSwaps: bigint;
  swaps: bigint;
  first1kSwaps: boolean;
  first10kSwaps: boolean;
  first100kSwaps: boolean;
}

export interface TokenIdData {
  id: string;
  tokenId: bigint;
  chainId: number;
  pointsEarned: bigint;
  pointsClaimed: bigint;
  pointsSpent: bigint;
}
