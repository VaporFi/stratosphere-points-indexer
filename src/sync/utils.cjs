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

  return tokenIdDataCombined;
}

// Lets introduce a tier system to the points
// Example, the top 0.01% of the users get the "Obsidian" tier
// The top 0.05% get the "Diamond" tier
// The top 0.2% get the "Platinum" tier
// The top 1% get the "Gold" tier
// The top 5% get the "Silver" tier
// Remaining get the "Basic" tier
function getTier(tokenIdDataCombined, userTokenId) {
  // Extract data into an array for sorting
  const tokenIdData = Object.keys(tokenIdDataCombined).map((tokenId) => {
    const { pointsEarned, pointsClaimed, pointsSpent } =
      tokenIdDataCombined[tokenId];
    return { tokenId, pointsEarned, pointsClaimed, pointsSpent };
  });

  // Sort tokenIdData by (pointsEarned - pointsSpent) in descending order
  tokenIdData.sort((a, b) => {
    const totalPointsA = a.pointsEarned - a.pointsSpent;
    const totalPointsB = b.pointsEarned - b.pointsSpent;
    return totalPointsB - totalPointsA;
  });

  // Calculate the percentile of the user
  const userIndex = tokenIdData.findIndex(
    (data) => data.tokenId === userTokenId
  );
  const totalUsers = tokenIdData.length;
  const percentile = ((totalUsers - userIndex) / totalUsers) * 100;

  // Determine the tier based on the percentile
  if (percentile <= 0.01) {
    return 5;
  } else if (percentile <= 0.05) {
    return 4;
  } else if (percentile <= 0.2) {
    return 3;
  } else if (percentile <= 1) {
    return 2;
  } else if (percentile <= 5) {
    return 1;
  } else {
    return 0;
  }
}

async function getTokenIdDataCombimedWithTier(chainId, userTokenId) {
  const tokenIdDataCombined = await getTokenIdDataCombimed(chainId);
  const tier = getTier(tokenIdDataCombined, userTokenId);

  return { ...tokenIdDataCombined, tier };
}

module.exports = getTokenIdDataCombimedWithTier;
