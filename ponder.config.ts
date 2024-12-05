import { createConfig, loadBalance } from "@ponder/core";
import { http } from "viem";

import { DexAggregatorAbi } from "./abis/DexAggregatorAbi";
import { StratosphereAbi } from "./abis/StratosphereAbi";
import { addresses, rpcMap } from "./src/config/constants";

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
      transport: loadBalance([
        http("https://api.avax.network/ext/bc/C/rpc"),
        http("https://avalanche.drpc.org"),
      ]),
    },
    telos: {
      chainId: 40,
      transport: http(rpcMap.telos),
    },
  },
  contracts: {
    DexAggregator: {
      abi: DexAggregatorAbi,
      network: {
        avalanche: {
          address: [
            addresses.DexAggregator?.avalanche!,
            addresses.DexAggregatorV2?.avalanche!,
          ],
          startBlock: 20308160,
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
          startBlock: 33291048,
          maxBlockRange,
        },
      },
    },

    RewardsController: {
      abi: RewardsControllerAbi,
      network: {
        avalanche: {
          address: addresses.RewardsController?.avalanche,
          startBlock: 43508160, // TODO: Update this
          maxBlockRange,
        },
      },
    },
  },
});
