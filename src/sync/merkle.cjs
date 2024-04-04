const { AbiCoder } = require("ethers");
const keccack256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const getTokenIdDataCombimedWithTier = require("./merkle.cjs");

// async function getMerkleRoot(chainId) {
//   const data = await getTokenIdDataCombimedWithTier(chainId);
//   const leaves = Object.keys(data).map((tokenId) => {
//     return encodeLeaf(tokenId, data[tokenId], data[tokenId].tier);
//   });
//   const tree = new MerkleTree(leaves, keccack256, { sortPairs: true });
//   const root = tree.getHexRoot();
//   console.log("root:", root);
//   return root;
// }

// function encodeLeaf(tokenId, points, tier) {
//   const encoder = AbiCoder.defaultAbiCoder();
//   const leaf = encoder.encode(
//     ["uint256", "uint256", "uint256"],
//     [tokenId, points]
//   );
//   return leaf;
// }

getMerkleRoot(43114).catch((error) => console.error(error));
