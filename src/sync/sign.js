import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import getPointsByTokenId from "./utils.cjs";
import { Signature } from "ethers";

const KEY = process.env.ORACLE_PRIVATE_KEY || "";

async function sign(tokenId, wallet, chainId) {
  const account = privateKeyToAccount(KEY);

  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  const points = await getPointsByTokenId(tokenId, chainId);

  const domain = {
    name: "RewardsController",
    version: "1",
    chainId,
    verifyingContract: "0x",
  };

  const types = {
    Data: [
      { name: "tokenId", type: "uint256" },
      { name: "points", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "user", type: "uint256" },
    ],
  };

  const value = {
    tokenId: tokenId,
    points,
    // Get the nonce
    nonce: 0,
    user: wallet,
  };

  const signature = await client.signTypedData(domain, types, value);

  const { r, s, v } = Signature.from(signature);

  return { r, s, v };
}
