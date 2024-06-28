require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function getAllPoints(chainId) {
  console.log(
    "Fetching all points from the database for the chainId: ",
    chainId
  );
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
  console.log("Fetching claimed points from the database");
  const claimedPoints = await sql`
    SELECT "tokenId", "pointsClaimed"
    FROM public."TokenIdData"
    WHERE "chainId" = ${chainId}
    ;`;

  return claimedPoints;
}

async function getCombinedPoints(chainId) {
  console.log("Fetching combined points for the chainId: ", chainId);
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

  const claimedPoints = await getClaimedPoints(chainId);

  claimedPoints.forEach((data) => {
    const { tokenId } = data;
    if (combinedPointByTokenId[tokenId]) {
      combinedPointByTokenId[tokenId] -= data.pointsClaimed;
    }
  });

  console.log(
    "Successfully fetched combined points for the chainId: ",
    chainId
  );
  return combinedPointByTokenId;
}

module.exports = getCombinedPoints;
