const { AbiCoder } = require("ethers");
const keccack256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const getCombinedPoints = require("./utils.cjs");

/**
 *
 * @param {number} chainId
 * @returns {Promise<[MerkleTree,string]>} [merkleTree, root]
 */
async function getMerkleTree(chainId) {
  const data = await getCombinedPoints(chainId);
  console.log("Generating Merkle Root........");
  const leaves = Object.keys(data).map((tokenId) => {
    return encodeLeaf(tokenId, data[tokenId]);
  });
  const tree = new MerkleTree(leaves, keccack256, { sortPairs: true });
  const root = tree.getHexRoot();
  console.log("root:", root);
  return [tree, root];
}

function encodeLeaf(tokenId, points) {
  const encoder = AbiCoder.defaultAbiCoder();
  const leaf = encoder.encode(["uint256", "uint256"], [tokenId, points]);
  return leaf;
}

module.exports = { getMerkleTree, encodeLeaf };
