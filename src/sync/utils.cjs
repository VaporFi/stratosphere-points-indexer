require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function getAllPoints(chainId) {
  const userIdPoint = await sql`
    SELECT "userDataId",  "points"
    FROM public."Points"
    WHERE "chainId" = ${chainId}
    ;`;

  return userIdPoint;
}

async function getTokenIdByUserId(userId) {
  // userId already includes the chainId
  const tokenId = await sql`
    SELECT "linkedToTokenId"
    FROM public."UserData"
    WHERE "id" = ${userId}
    ;`;

  return tokenId;
}

async function getClaimedPoints(chainId) {
  const claimedPoints = await sql`
    SELECT "tokenId", "claimedPoints"
    FROM public."TokenIdData"
    WHERE "chainId" = ${chainId}
    ;`;

  return claimedPoints;
}

async function getCombinedPoints(chainId) {
  const allPoints = await getAllPoints(chainId);

  const pointsWithTokenId = await Promise.all(
    allPoints.map(async (data) => {
      let tokenId = await getTokenIdByUserId(data.userDataId);
      const points = data.points;
      tokenId = tokenId[0].linkedToTokenId;
      return { points, tokenId };
    })
  );

  const combinedPointByTokenId = pointsWithTokenId.reduce((acc, data) => {
    const tokenId = data.tokenId;
    if (!acc[tokenId]) {
      acc[tokenId] = 0;
    }
    acc[tokenId] += parseInt(data.points);
    return acc;
  }, {});

  const claimedPoints = await getClaimedPoints();

  claimedPoints.forEach((data) => {
    const { tokenId, claimedPoints } = data;
    if (combinedPointByTokenId[tokenId]) {
      combinedPointByTokenId[tokenId] -= claimedPoints;
    }
  });

  return combinedPointByTokenId;
}

module.exports = getCombinedPoints;
