import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import getMerkleRoot from "./merkle.cjs";

import { parseAbi } from "viem";

const abi = parseAbi([
  "function setMerkleRoot(bytes32 _merkleRoot)",
  "function s_merkleRoot() view returns (bytes32)",
]);

const KEY = process.env.ORACLE_PRIVATE_KEY || "";

async function sync(chainId) {
  const account = privateKeyToAccount(KEY);

  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  const root = await getMerkleRoot(chainId);

  const tx = await client.writeContract({
    address: "0x",
    abi: abi,
    functionName: "setMerkleRoot",
    args: [root],
  });

  console.log(tx);
}
