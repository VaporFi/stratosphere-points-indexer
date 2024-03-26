require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function getAllPoints() {
  const userIdPoint = await sql`
    SELECT "userDataId",  "points"
    FROM public."Points"
    ;`;

  return userIdPoint;
}

async function getTokenIdByUserId(userId) {
  const tokenId = await sql`
    SELECT "linkedToTokenId"
    FROM public."UserData"
    WHERE "id" = ${userId}
    ;`;

  return tokenId;
}

async function getCombinedPoints() {
  const allPoints = await getAllPoints();

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

  return combinedPointByTokenId;
}

module.exports = getCombinedPoints;
