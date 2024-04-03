require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

const weeklyEntitiesInMonth = 4;
const weeklyEntitiesInYear = weeklyEntitiesInMonth * 12;

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

async function getTokenIdData(chainId) {
  const tokenIdData = await sql`
    SELECT *
    FROM public."TokenIdData"
    WHERE "chainId" = ${chainId}
    ;`;
}

async function getTokenIdDataWeekly(chainId, tokenId) {
  const tokenIdDataWeekly = await sql`
  SELECT *
  FROM public."TokenIdDataWeekly"
  WHERE "chainId" = ${chainId}
  AND "tokenId" = ${tokenId}
  ORDER BY "lastUpdated" DESC
  ;`;

  return tokenIdDataWeekly;
}

async function getTokenIdDataCombimed(chainId) {
  const tokenIdData = await getTokenIdData(chainId);

  const tokenIdDataCombined = tokenIdData.reduce((acc, data) => {
    const tokenId = data.tokenId;
    if (!acc[tokenId]) {
      acc[tokenId] = {
        pointsEarned: 0,
        pointsClaimed: 0,
        pointsSpent: 0,
      };
    }
    acc[tokenId].pointsEarned += parseInt(data.pointsEarned);
    acc[tokenId].pointsClaimed += parseInt(data.pointsClaimed);
    acc[tokenId].pointsSpent += parseInt(data.pointsSpent);
    return acc;
  }, {});

  return tokenIdDataCombined; // Equivalent to the return of getCombinedPoints
}

async function implementCriterias(chainId) {
  const combinedPointByTokenId = await getTokenIdDataCombimed(chainId);

  // Check if the user claimed points in the previous month
}

module.exports = getCombinedPoints;

// Criterias:
// Criteria 1: At each calendar month's start, my accrued points from 12 months prior are reset.

// Criteria 2: The reset takes into account only the points that I didn’t claim in the previous month.

// Criteria 3: The reset is made for each chain where strat is available

// Criteria 4: The reset is made for each token ID
