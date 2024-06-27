const { AbiCoder } = require("ethers");
const keccack256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const getCombinedPoints = require("./utils.cjs");

async function getMerkleRoot(chainId) {
  const data = await getCombinedPoints(chainId);
  const leaves = Object.keys(data).map((tokenId) => {
    return encodeLeaf(tokenId, data[tokenId]);
  });
  const tree = new MerkleTree(leaves, keccack256, { sortPairs: true });
  const root = tree.getHexRoot();
  console.log("root:", root);
  return root;
}

function encodeLeaf(tokenId, points) {
  const encoder = AbiCoder.defaultAbiCoder();
  const leaf = encoder.encode(["uint256", "uint256"], [tokenId, points]);
  return leaf;
}

getMerkleRoot(43114).catch((error) => console.error(error));

module.exports = getMerkleRoot;
