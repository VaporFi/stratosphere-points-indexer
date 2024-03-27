import { createConfig } from "@ponder/core";
import { http } from "viem";

import { DexAggregatorAbi } from "./abis/DexAggregatorAbi";
import { StratosphereAbi } from "./abis/StratosphereAbi";
import { addresses } from "./src/config/constants";

import { LiquidMiningAbi } from "./abis/LiquidMiningAbi";
import { VapeStakingAbi } from "./abis/VapeStakingAbi";
import { RewardsControllerAbi } from "./abis/RewardsControllerAbi";

const maxBlockRange = process.env.MAX_BLOCK_RANGE
  ? parseInt(process.env.MAX_BLOCK_RANGE)
  : 2_000;

export default createConfig({
  networks: {
    avalanche: {
      chainId: 43114,
      transport: http("https://api.avax.network/ext/bc/C/rpc"),
    },
    telos: {
      chainId: 40,
      transport: http("https://api.telos.kainosbp.com"),
    },
  },
  contracts: {
    DexAggregator: {
      abi: DexAggregatorAbi,
      network: {
        avalanche: {
          address: addresses.DexAggregator?.avalanche,
          startBlock: 42346292,
          maxBlockRange,
        },
      },
    },
    Stratosphere: {
      abi: StratosphereAbi,
      network: {
        avalanche: {
          address: addresses.Stratosphere?.avalanche,
          startBlock: 20310567,
          maxBlockRange,
        },
      },
    },

    LiquidMining: {
      abi: LiquidMiningAbi,
      network: {
        avalanche: {
          address: addresses.LiquidMining?.avalanche,
          startBlock: 32271032,
          maxBlockRange,
        },
      },
    },

    VapeStaking: {
      abi: VapeStakingAbi,
      network: {
        avalanche: {
          address: addresses.VapeStaking?.avalanche,
          startBlock: 32271032,
          maxBlockRange,
        },
      },
    },

    RewardsController: {
      abi: RewardsControllerAbi,
      network: {
        avalanche: {
          address: addresses.RewardsController?.avalanche,
          startBlock: 32271032, // TODO: Update this
          maxBlockRange,
        },
      },
    },
  },
});
