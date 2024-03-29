export const LiquidMiningAbi = [
  {
    inputs: [],
    name: "BoostFacet__BoostAlreadyClaimed",
    type: "error",
  },
  {
    inputs: [],
    name: "BoostFacet__InvalidBoostLevel",
    type: "error",
  },
  {
    inputs: [],
    name: "BoostFacet__InvalidFeeReceivers",
    type: "error",
  },
  {
    inputs: [],
    name: "BoostFacet__UserNotParticipated",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "boostLevel",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_boostPoints",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "boostFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tier",
        type: "uint256",
      },
    ],
    name: "ClaimBoost",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "boostLevel",
        type: "uint256",
      },
    ],
    name: "claimBoost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "ClaimFacet__InProgressSeason",
    type: "error",
  },
  {
    inputs: [],
    name: "LAuthorizable__OnlyAuthorized",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rewardsAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositAmount",
        type: "uint256",
      },
    ],
    name: "Claim",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_seasonId",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "_users",
        type: "address[]",
      },
    ],
    name: "automatedClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "DepositFacet__FundsInPrevSeason",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositFacet__InvalidMiningPass",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositFacet__NotEnoughTokenBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositFacet__ReentrancyGuard__ReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositFacet__SeasonEnded",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "MiningPassFacet__InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "MiningPassFacet__InvalidTier",
    type: "error",
  },
  {
    inputs: [],
    name: "MiningPassFacet__SeasonEnded",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tier",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "MiningPassPurchase",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "miningPassOf",
    outputs: [
      {
        internalType: "uint256",
        name: "_tier",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_depositLimit",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tier",
        type: "uint256",
      },
    ],
    name: "purchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "UnlockFacet__AlreadyUnlocked",
    type: "error",
  },
  {
    inputs: [],
    name: "UnlockFacet__InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "UnlockFacet__InvalidFeeReceivers",
    type: "error",
  },
  {
    inputs: [],
    name: "UnlockFacet__InvalidUnlock",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "unlockFee",
        type: "uint256",
      },
    ],
    name: "Unlocked",
    type: "event",
  },
  {
    inputs: [],
    name: "COOLDOWN_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "unlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "WithdrawFacet__InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "WithdrawFacet__UnlockNotMatured",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "seasonId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "WithdrawUnlockedVPND",
    type: "event",
  },
  {
    inputs: [],
    name: "withdrawUnlocked",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
