import { createConfig } from "@ponder/core";
import { http } from "viem";

import { DexAggregatorAbi } from "./abis/DexAggregatorAbi";
import { StratosphereAbi } from "./abis/StratosphereAbi";
import { addresses } from "./src/config/constants";

import { LiquidMiningAbi } from "./abis/LiquidMiningAbi";
import { VapeStakingAbi } from "./abis/VapeStakingAbi";

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
        },
      },
    },
    Stratosphere: {
      abi: StratosphereAbi,
      network: {
        avalanche: {
          address: addresses.Stratosphere?.avalanche,
          startBlock: 20310567,
        },
      },
    },

    LiquidMining: {
      abi: LiquidMiningAbi,
      network: {
        avalanche: {
          address: addresses.LiquidMining?.avalanche,
          startBlock: 32271032,
        },
      },
    },

    VapeStaking: {
      abi: VapeStakingAbi,
      network: {
        avalanche: {
          address: addresses.VapeStaking?.avalanche,
          startBlock: 32271032,
        },
      },
    },
  },
});
