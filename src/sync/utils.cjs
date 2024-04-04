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

  tokenIdDataCombined = attachTierToTokenIdData(tokenIdDataCombined);

  return tokenIdDataCombined; // Equivalent to the return of getCombinedPoints
}

async function getTier(totalPoints, totalUsers) {
  totalUsers = totalUsers[0].count;

  const obsidianTier = Math.floor(totalUsers * 0.0001);
  const diamondTier = Math.floor(totalUsers * 0.0005);
  const platinumTier = Math.floor(totalUsers * 0.002);
  const goldTier = Math.floor(totalUsers * 0.01);
  const silverTier = Math.floor(totalUsers * 0.05);

  if (totalPoints > obsidianTier) {
    return 5;
  } else if (totalPoints > diamondTier) {
    return 4;
  } else if (totalPoints > platinumTier) {
    return 3;
  } else if (totalPoints > goldTier) {
    return 2;
  } else if (totalPoints > silverTier) {
    return 1;
  } else {
    return 0;
  }
}

async function attachTierToTokenIdData(tokenIdData) {
  const tokenIdDataWithTier = tokenIdData.map((data) => {
    const { pointsEarned, pointsSpent } = data;
    const totalPoints = pointsEarned - pointsSpent;
    const tier = getTier(totalPoints, tokenIdData.length);
    return { ...data, tier };
  });

  return tokenIdDataWithTier;
}

module.exports = getTokenIdDataCombimed;
