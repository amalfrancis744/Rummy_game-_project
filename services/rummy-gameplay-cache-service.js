/* eslint-disable no-console */
const rummyRoomCacheService = require("./rummy-room-cache-service");
const redisService = require("./redis-service")("mgp-rummy:gameplay-cache");

function getRoomMap() {
  try {
    return redisService.getAll("*", 1);
  } catch (error) {
    console.error("debugGameData", error);
    throw error;
  }
}

async function startGame(room) {
  try {
    const masterKey = room.roomId;
    await Promise.all(
      Object.keys(room).map(async (key) => {
        await redisService.hSet(masterKey, key, room[key]);
      })
    );
  } catch (error) {
    console.error("newRoom", error);
    throw error;
  }
}

async function deleteRoom(roomId) {
  try {
    console.log("Gameplay cache delete--->" , roomId)
    await rummyRoomCacheService.deleteRoom(roomId);
    await redisService.hDel(roomId);
  } catch (error) {
    console.error("deleteRoom", error);
    throw error;
  }
}

async function getRoomData(roomId) {
  try {
    // console.log("Room id inside get room data--->" , roomId)
    const roomData = await redisService.hGetAll(roomId);
    // console.log("Data found in get room data-->", roomData);
    return roomData;
  } catch (error) {
    console.error("getRoomData", error);
    throw error;
  }
}

async function updateRoomData(room, data) {
  try {
    const masterKey = room.roomId;
    for (const key in data) {
      // console.log("Master ket in update room-->" , masterKey , "data--->" , data[key])
      await redisService.hSet(masterKey, key, data[key]);
    }
  } catch (error) {
    console.error("updateRoomData", error);
    throw error;
  }
}

async function updateCurrentPlayer(room, currentPlayer) {
  // console.log("Update current player-------------->" , currentPlayer)
  try {
    return updateRoomData(room, { currentPlayer });
  } catch (error) {
    console.error("updateCurrentPlayer", error);
    throw error;
  }
}

async function updateCurrentPlayerLife(room, life) {
  try {
    const currentPlayer = await redisService.hGet(room.roomId, "currentPlayer");
    currentPlayer.life = life;
    await redisService.hSet(room.roomId, "currentPlayer", currentPlayer);

    const players = await redisService.hGet(room.roomId, "players");
    const currentPlayerRef = players.find(
      (e) => e.userId === room.currentPlayer.userId
    );
    if (currentPlayerRef) {
      currentPlayerRef.life = life;
    }
    await redisService.hSet(room.roomId, "players", players);
  } catch (error) {
    console.error("updateCurrentPlayerLife", error);
    throw error;
  }
}

async function disqualifyCurrentPlayer(room) {
  try {
    const currentPlayer = await redisService.hGet(room.roomId, "currentPlayer");
    currentPlayer.disqualified = true;
    await redisService.hSet(room.roomId, "currentPlayer", currentPlayer);

    const players = await redisService.hGet(room.roomId, "players");
    const currentPlayerRef = players.find(
      (e) => e.userId === room.currentPlayer.userId
    );
    if (currentPlayerRef) {
      currentPlayerRef.disqualified = true;
    }
    await redisService.hSet(room.roomId, "players", players);
  } catch (error) {
    console.error("disqualifyCurrentPlayer", error);
    throw error;
  }
}

async function disqualifyPlayer(room, userId) {
  try {
    const players = await redisService.hGet(room.roomId, "players");
    const playerRef = players.find((e) => e.userId === userId);
    if (playerRef) {
      playerRef.disqualified = true;
    }
    await redisService.hSet(room.roomId, "players", players);
  } catch (error) {
    console.error("disqualifyPlayer", error);
    throw error;
  }
}
async function increaseLeftCount(roomId) { 
  try {
    const roomData = await this.getRoomData(roomId)

    await redisService.hSet(roomId, "leftCount", roomData.leftCount + 1);
  } catch (error) {
    console.error("disqualifyPlayer", error);
    throw error;
  }
}

async function updateTimerValue(roomId, endsAt) {
  console.log("Updating timer value---------------------------------->>>>>")
  try {
    const masterKey = roomId;
    await redisService.hSet(
      masterKey,
      "timerEndsAt",
      new Date(endsAt).toISOString()
    );
  } catch (error) {
    console.error("updateTimerValue", error);
    throw error;
  }
}
async function updateJoiningTimerValue(roomId, time) {
  try {
    const masterKey = roomId;
    return  await redisService.hSet(
      masterKey,
      "joiningTimer",
      time
    );
  } catch (error) {
    console.error("updateTimerValue", error);
    throw error;
  }
}

async function updateClosedDeck(roomId) {
  try {
    console.log("Room Id in update closed deck--->" , roomId)
    const openDeck = await redisService.hGet(roomId, "openDeck");
    console.log("OpenDeck---------->" , openDeck)
    if (openDeck !== null) {
      await redisService.cardUpdate(roomId, "closedDeck", openDeck);
      console.log("Closed Deck updated for room", roomId);
    } else {
      console.log("No open deck found for room", roomId);
    }
  } catch (error) {
    console.error("updateClosedDeck", error);
    throw error;
  }
}

async function hIncrBy(roomId, field, value) {
  try {
    const masterKey = roomId;
    return redisService.hIncrBy(masterKey, field, value);
  } catch (error) {
    console.error("hIncrBy", error);
    throw error;
  }
}

async function hDecrBy(roomId, field, value) {
  try {
    const masterKey = roomId;
    return redisService.hDecrBy(masterKey, field, value);
  } catch (error) {
    console.error("hDecrBy", error);
    throw error;
  }
}

async function updateHasSubmittedKey(roomId, field, value) {
  try {
    const masterKey = roomId;
    await redisService.hSet(masterKey, field, value);
  } catch (error) {
    console.error("updateHasSubmittedKey", error);
    throw error;
  }
}

async function updateHasDroppedKey(roomId, field, value) {
  try {
    console.log("Entered into dropped Key---->" , roomId , "field--->" , field ,"Value--->" , value)
    const masterKey = roomId;
    await redisService.hSet(masterKey, field, value);
  } catch (error) {
    console.error("updateHasDroppedKey", error);
    throw error;
  }
}

async function updateAutoDropKey(roomId, field, value) {
  try {
    const masterKey = roomId;
    await redisService.hSet(masterKey, field, value);
  } catch (error) {
    console.error("updateAutoDropKey", error);
    throw error;
  }
}

async function updateIsEliminatedKey(roomId, field, value) {
  try {
    const masterKey = roomId;
    await redisService.hSet(masterKey, field, value);
  } catch (error) {
    console.error("updateIsEliminatedKey", error);
    throw error;
  }
}

async function updateSplitPrizeKey(roomId, field, value) {
  try {
    const masterKey = roomId;
    await redisService.hSet(masterKey, field, value);
  } catch (error) {
    console.error("updateSplitPrizeKey", error);
    throw error;
  }
}

async function initGame(room) {
  try {
    // Initialize game-specific data here
    room.startTime = new Date().toISOString();
    room.round = 1;
    await updateRoomData(room, room);
  } catch (error) {
    console.error("initGame", error);
    throw error;
  }
}


module.exports = {
  getRoomMap,
  initGame,
  startGame,
  deleteRoom,
  getRoomData,
  updateRoomData,
  updateCurrentPlayer,
  updateCurrentPlayerLife,
  updateClosedDeck,
  disqualifyCurrentPlayer,
  disqualifyPlayer,
  updateTimerValue,
  hIncrBy,
  hDecrBy,
  updateJoiningTimerValue,
  increaseLeftCount,
  updateAutoDropKey,
  updateHasSubmittedKey,
  updateHasDroppedKey,
  updateIsEliminatedKey,
  updateSplitPrizeKey,
};
