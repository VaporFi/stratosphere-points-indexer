import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { getMerkleTree, encodeLeaf } from "./merkle.cjs";

import { parseAbi } from "viem";
import getCombinedPoints from "./utils.cjs";
import { createDirectus, createItems } from "@directus/sdk";

const directusUrl = process.env.DIRECTUS_URL;
const staticToken = process.env.DIRECTUS_STATIC_TOKEN;

function getDirectusClient() {
  if (!directusUrl) throw new Error("Missing Params.");

  const client = createDirectus(process.env.DIRECTUS_URL)
    .with(authentication())
    .with(rest());

  if (staticToken) {
    client.setToken(staticToken);
  }
  return client;
}

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

  try {
    const [[tree, root], combinedPoints] = await Promise.all([
      await getMerkleTree(chainId),
      await getCombinedPoints(chainId),
    ]);

    const leafByTokenId = Object.keys(combinedPoints).map((key) => ({
      token_id: key,
      proof: tree.getHexProof(encodeLeaf(key, combinedPoints[key])),
    }));
    const client = getDirectusClient();
    await client.request(createItems("stratosphere_proof", leafByTokenId));

    const tx = await client.writeContract({
      address: "0x",
      abi: abi,
      functionName: "setMerkleRoot",
      args: [root],
    });
  } catch (error) {
    console.error("An error occured:", error);
  }
}
