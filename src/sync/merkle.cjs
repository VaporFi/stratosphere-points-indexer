const { AbiCoder } = require("ethers");
const keccack256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const getCombinedPoints = require("./utils.cjs");

async function getMerkleRoot() {
  const data = await getCombinedPoints();
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

getMerkleRoot().catch((error) => console.error(error));
