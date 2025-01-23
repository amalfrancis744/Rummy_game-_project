// const sender = require('../sqs/sender');
const constants = require("../util/constants");
const requestTemplate = require("../util/request-template");
const rummyRoomCacheService = require("./rummy-room-cache-service");
const rummyGame = require("./rummy-game");
const { ErrorCodes } = require("../model/base-response");
const md5 = require("md5");

async function validateGameplayToken(token) {
  const req = requestTemplate.generateRequestObject("room.roomId");
  const response = await requestTemplate.get(
    req,
    constants.SERVICES.game,
    "/mgp-game/api/v1/game-play/validate-token",
    { token }
  );
  return response.data && response.data.result;
}

async function invalidateToken(room, token) {
  try {
    // const req = requestTemplate.generateRequestObject(room.roomId);
    // await sender.emit(req, 'invalidate-game-play-token', { token }, constants.SERVICES.game);
    if (room.battleId && room.rummyType === constants.RUMMY_TYPE.POINT) {
      const player = room.players.find(
        (e) => e.gamePlayTokenMd5 === md5(token)
      );
      player.entryFees =
        room[rummyGame.getScoreKey(player.userId)] * room.rupeePerPoint;
      player.battleId = room.battleId;
      // await sender.emit(req, 'deduct-rummy-lost-money', player, constants.SERVICES.game);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishGamePlayEvent", room.roomId, error);
  }
}

async function invalidateOtherTokens(room, userId, token) {
  try {
    // const req = requestTemplate.generateRequestObject(room.roomId);
    // await sender.emit(
    //   req,
    //   "invalidate-other-game-play-tokens",
    //   { userId, token },
    //   constants.SERVICES.game
    // );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishGamePlayEvent", room.roomId, error);
  }
}

async function markAsDisqualified(room, userId, gamePlayTokenMd5) {
  try {
    // const req = requestTemplate.generateRequestObject(room.roomId);
    // await sender.emit(
    //   req,
    //   "disqualify-game-play-token",
    //   { userId, gamePlayTokenMd5 },
    //   constants.SERVICES.game
    // );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishGamePlayEvent", room.roomId, error);
  }
}

async function refundGameAmount(room, token) {
  try {
    // const req = requestTemplate.generateRequestObject(room.roomId);
    // await sender.emit(
    //   req,
    //   "game-play-refund",
    //   { token },
    //   constants.SERVICES.game
    // );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishGamePlayEvent", room.roomId, error);
  }
}

async function leaveGame({ token, userId, deviceId }) {
  let userRoom = await rummyRoomCacheService.getUserRoom(userId);
  if (!userRoom) {
    throw ErrorCodes.NO_ACTIVE_GAME_FOUND;
  }
  const userRoomPlayer = userRoom.players.find((e) => e.userId === userId);
  if (!userRoomPlayer) {
    throw ErrorCodes.NO_ACTIVE_GAME_FOUND;
  }
  if (userRoomPlayer.xDeviceId !== deviceId) {
    // throws Cannot read property 'xDeviceId' of undefined.. userRoom cache exists but without that player in the players array
    // eslint-disable-next-line no-console
    throw ErrorCodes.ALREADY_PLAYING_ON_OTHER_DEVICE;
  }
  const player = await rummyRoomCacheService.removeUserFromRoom(
    userRoom.roomId,
    userId
  );
  if (!player) {
    throw ErrorCodes.NO_ACTIVE_GAME_FOUND;
  }
  // eslint-disable-next-line no-console
  console.log("game-service-player-removed", userId, userRoom.roomId);
  rummyGame.emit(userRoom.roomId, "player-removed", { player });
  if (userRoom.isGameStarted) {
    // eslint-disable-next-line no-console
    console.log(
      "game-service-isGameStarted true, removing user from gameplay",
      userRoom.roomId,
      userId
    );
    await rummyGame.leaveGame(
      userRoom.roomId,
      userId,
      rummyGame.sanitizeCallback()
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(
      "game-service-isGameStarted false, refunding amount",
      userRoom.roomId,
      userId
    );
    // refund as game is not started yet
    await refundGameAmount(userRoom, token);
  }
}

module.exports = {
  validateGameplayToken,
  refundGameAmount,
  leaveGame,
  invalidateToken,
  invalidateOtherTokens,
  markAsDisqualified,
};
