/* eslint-disable quotes */
/* eslint-disable no-console */
const { DateTime } = require("luxon");
const { ErrorCodes } = require("../model/base-response");
const response = require("../services/response");
const rummyGameplayCacheService = require("./rummy-gameplay-cache-service");
const rummyRoomCacheService = require("./rummy-room-cache-service");
const userQuery = require("../model/users/index");
const tableQuery = require("../model/table/index");
const requestTemplate = require("../util/request-template");
// const sender = require('../sqs/sender');
const requestAPI = require("./apiIntegration");
const constants = require("../util/constants");
const utils = require("../util/utils");
const config = require("../config/index");
const GAME_START_DELAY_SECONDS = process.env.GAME_START_DELAY_SECONDS
  ? +process.env.GAME_START_DELAY_SECONDS
  : 5; // seconds
const TURN_TIMER = process.env.TURN_TIMER ? +process.env.TURN_TIMER : 30;
const CARD_SUBMIT_TIMER = process.env.CARD_SUBMIT_TIMER
  ? +process.env.CARD_SUBMIT_TIMER
  : 45;
const GAME_INIT_COUNTDOWN_DELAY = process.env.GAME_INIT_COUNTDOWN_DELAY
  ? +process.env.GAME_INIT_COUNTDOWN_DELAY
  : 5;
const FIRST_DROP_POINTS_80 = 20;
const MIDDLE_DROP_POINTS_80 = 40;
const FIRST_DROP_POINTS_101 = 20;
const MIDDLE_DROP_POINTS_101 = 40;
const FIRST_DROP_POINTS_201 = 25;
const MIDDLE_DROP_POINTS_201 = 50;

const TIMER_CHANNEL = "mgp-rummy:rummy:game-timer";

const SELF_ID = require("node-uuid").v4();
const REMAINING_PLAYERS_KEY = "remaining-players";
const SUBMIT_COUNTER_KEY = "submit-count-players";
const SPLIT_PRIZE_COUNTER_KEY = "split-prize-counter";

const { createClient } = require("redis");
const cardService = require("./card-service");
const Room = require("../model/room/room");
const room = require("../model/room/room");
const subscriber = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});
const publisher = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});

publisher.connect();

const timers = {};

subscriber.connect().then(() => {
  subscriber.subscribe(TIMER_CHANNEL, (msg) => {
    msg = JSON.parse(msg);
    if (SELF_ID === msg.id) {
      return;
    }

    if (timers[msg.roomId]) {
      clearTimeout(timers[msg.roomId]);
    }
  });
});

function getScoreKey(userId) {
  return `${userId}-score`;
}

function getHasSubmittedKey(userId) {
  return `${userId}-hasSubmitted`;
}

function getHasDroppedKey(userId) {
  return `${userId}-hasDropped`;
}

function getAutoDropKey(userId) {
  return `${userId}-autoDrop`;
}

function getIsEliminatedKey(userId) {
  return `${userId}-isEliminated`;
}

function getSplitPrizeKey(userId) {
  return `${userId}-splitPrize`;
}

function getDropCountKey(userId) {
  return `${userId}-dropCount`;
}

function getPlayers(room) {
  let playerArray = [];
  room.players.map((player) => {
    if (player.disqualified !== true) {
      player.score = room[getScoreKey(player.userId)];
      player.hasSubmitted = room[getHasSubmittedKey(player.userId)];
      player.hasDropped = room[getHasDroppedKey(player.userId)];
      player.autoDrop = room[getAutoDropKey(player.userId)];
      player.isEliminated = room[getIsEliminatedKey(player.userId)];
      if (room.canSplitPrize) {
        player.splitPrize = room[getSplitPrizeKey(player.userId)];
      }

      playerArray.push(player);
    }
    // rummyGameplayCacheService.updatePlayerLife(room,3,player.userId);
  });
  return playerArray;
}

const deckOfCards = [
  "sA",
  "sK",
  "sQ",
  "sJ",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "hA",
  "hK",
  "hQ",
  "hJ",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "h7",
  "h8",
  "h9",
  "h10",
  "dA",
  "dK",
  "dQ",
  "dJ",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
  "d10",
  "cA",
  "cK",
  "cQ",
  "cJ",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "c10",
  "sA",
  "sK",
  "sQ",
  "sJ",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "hA",
  "hK",
  "hQ",
  "hJ",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "h7",
  "h8",
  "h9",
  "h10",
  "dA",
  "dK",
  "dQ",
  "dJ",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
  "d10",
  "cA",
  "cK",
  "cQ",
  "cJ",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "c10",
  "j1",
  "j2",
];

/**
 *
 * @param {*} players : [{ userId }]
 */
async function initGame(roomCache, io) {
  try {
    const { players, roomId } = roomCache;

    console.log("Player length---->", players.length);
    if (players.length <= 1) {
      throw ErrorCodes.GENERATE_BAD_REQUEST("Min 2 players required");
    }

    let cardData = cardService.cardDistribution(
      JSON.parse(JSON.stringify(deckOfCards)),
      13,
      roomCache.players.length
    );

    // console.log("------------------------------Card Data----------------------------------" , cardData)
    console.log("this roocache--->", roomCache);
    const room = {
      roomId,
      gameId: roomCache.gameId,
      tournamentId: roomCache.tournamentId,
      battleId: roomCache.battleId,
      startTime: new Date().toISOString(),
      rummyType: roomCache.rummyType,
      gameMode: roomCache.gameMode,
      roomCode: roomCache.roomCode,
      hasShown: false,
      closedDeck: cardData.closeDeck,
      openDeck: [],
      hasPicked: false,
      canSplitPrize: false,
      jokerCard: cardData.jokerCard,
      jokerCards: cardData.jokerCards,
      rupeePerPoint: roomCache.rupeePerPoint,
      isCurrentPlayersSubmitted: false,
      players: [],
      round: 0,
      leftCount: 0,
      winner: [],
      submitTimer: roomCache.submitTimer,
    };

    console.log("Room data---- checjing - >", room);
    room[SUBMIT_COUNTER_KEY] = players.length;
    room[REMAINING_PLAYERS_KEY] = players.length;
    if (roomCache.rummyType === constants.RUMMY_TYPE.POOL) {
      room.maxPoint = roomCache.maxPoint;
      room.eliminatedPlayers = [];
      if (players.length === 6 && room.battleId) {
        room.canSplitPrize = true;
        room[SPLIT_PRIZE_COUNTER_KEY] = 0;
      }
    }
    for (const i in players) {
      // console.log("room.players - ",room.players);
      room.players.push({
        socketId: players[i].socketId,
        id: players[i].id,
        userId: players[i].userId,
        userName: players[i].userName,
        disqualified: false,
        gameplayTokenMd5: players[i].gameplayTokenMd5,
        noOfTurnsTaken: 0,
        cards: cardData[`player${i}`],
        hasShown: false,
        life: 3,
        token: players[i].token,
        profileImageUrl: config.default_user_pic,
        score: 0,
        mainWallet: players[i].mainWallet,
      });
      room[getScoreKey(players[i].userId)] = 0;
      room[getHasSubmittedKey(players[i].userId)] = false;
      room[getHasDroppedKey(players[i].userId)] = false;
      room[getAutoDropKey(players[i].userId)] = false;
      room[getIsEliminatedKey(players[i].userId)] = false;
      if (room.canSplitPrize) {
        room[getSplitPrizeKey(players[i].userId)] = false;
        room[getDropCountKey(players[i].userId)] = 0;
      }
    }
    let tossPlayers = [];
    const tossCards = utils.getRandomValueArray(deckOfCards, players.length);
    for (const i in players) {
      tossPlayers.push({
        userId: players[i].userId,
        card: tossCards[i],
      });
    }
    console.log("ammmmmmmmmmmmmmmmmmmmmmmal,annnnnnnnnnnnnnnnnnnnnnnannnnnnnnnnnnnnnnd")
    const tossWinner = cardService.tossWinner(tossPlayers);


    console.log("This for understanding the toss winner--->", tossWinner);

    emit(roomId, "game-init", { players: tossWinner.tossPlayers });
    const remainingPlayers = room.players.filter((e) => !e.disqualified);
    room.currentPlayer = remainingPlayers[tossWinner.firstPlayer];
    await rummyGameplayCacheService.startGame(room);
    const pendingPlayers = room.players.filter((e) => !e.disqualified);
    const findCurrentPlayer = room.players.find(
      (e) => e.userId === room.currentPlayer.userId
    );
    if (pendingPlayers.length > 1 && !findCurrentPlayer) {
      room.currentPlayer = pendingPlayers[0];
      if (room.currentPlayer.userId !== room.currentPlayer.userId) {
        room.currentPlayer = room.currentPlayer;
        await rummyGameplayCacheService.updateCurrentPlayer(
          room,
          room.currentPlayer
        );
      }
    }

    let walletArray = [];
    //Deduct wallet amount
    for(let user of room.players){

      // let userExists = await userQuery.getUser({_id : user.id});
      let userExists = await requestAPI.verifyUser("/api/v1/verify_user", user.token )

      let tableDetails = await requestAPI.fetchTable("/api/v1/get_rummy_config" , {token : user.token , tournamentId : room.tournamentId})

      // let tableDetails = await tableQuery.getTable({_id : room.tournamentId});

      console.log(" Fetching entry fee--------->" , tableDetails)

      let deductEntryFee = await userQuery.updateUser(userExists._id , {main_wallet : userExists.main_wallet - tableDetails.entry_fee});

      let updateUser = await userQuery.getUser({_id: userExists._id });

      console.log("going to deduct wallet amount--->" , updateUser);

      let userId = user.id;

      let obj = {
        [userId] : updateUser.main_wallet
      }
      // io.to(updateUser._id.toString()).emit("remitWalletAmount",updateUser.main_wallet)
      walletArray.push(obj)

    }
      emit(room.roomId , "remitWalletAmount",walletArray);

      walletArray=[];

    await start(room);
    await publishGamePlayEvent(room);

    // setTimeout(() => {
    //   startCountdown(room); // await is not written intentionally
    // }, GAME_INIT_COUNTDOWN_DELAY * 1000);
  } catch (err) {
    console.log("Error occured while initializing game", err);
  }
}

async function startCountdown(room) {
  try {
    const { roomId } = room;
    let isGameFinished = false;
    for (let i = 0; i < GAME_START_DELAY_SECONDS && !isGameFinished; i++) {
      emit(roomId, "countdown", {
        time: GAME_START_DELAY_SECONDS - i,
      });
      rummyGameplayCacheService.getRoomData(room.roomId).then((_room) => {
        if (_room && _room.roomId) {
          room = _room;
          isGameFinished = room.endTime;
        } else {
          isGameFinished = true;
        }
      });
      await utils.sleep(1000);
    }
    if (isGameFinished) {
      // no player left to start the game
      await publishGamePlayEvent(room); // to mark game as started in mgp-game microservice
      return;
    }
    // to check if first player was not left
    const updatedRoomData = await rummyGameplayCacheService.getRoomData(
      room.roomId
    );
    const pendingPlayers = updatedRoomData.players.filter(
      (e) => !e.disqualified
    );
    const findCurrentPlayer = updatedRoomData.players.find(
      (e) => e.userId === updatedRoomData.currentPlayer.userId
    );
    if (pendingPlayers.length > 1 && !findCurrentPlayer) {
      updatedRoomData.currentPlayer = pendingPlayers[0];
      if (updatedRoomData.currentPlayer.userId !== room.currentPlayer.userId) {
        room.currentPlayer = updatedRoomData.currentPlayer;
        await rummyGameplayCacheService.updateCurrentPlayer(
          room,
          room.currentPlayer
        );
      }
    }
    await start(updatedRoomData);
    await publishGamePlayEvent(updatedRoomData);
  } catch (err) {
    console.log("Error occured while starting animation countdown-->", err);
  }
}

function calculateTimeLeft(room) {
  const { timerEndsAt } = room;
  if (timerEndsAt) {
    return parseInt(
      Math.round(
        (new Date(timerEndsAt).getTime() - new Date().getTime()) / 1000
      )
    );
  }
  return TURN_TIMER;
}

function clearTimer(roomId) {
  if (timers[roomId]) {
    clearTimeout(timers[roomId]);
  } else {
    publisher.publish(TIMER_CHANNEL, JSON.stringify({ roomId, id: SELF_ID }));
  }
}

async function startTurnTimer(
  roomId,
  currentPlayerId,
  timeoutSeconds = TURN_TIMER
) {
  console.log("-----------Time out seconds----------------->>", timeoutSeconds);
  clearTimer(roomId);
  const startedAt = new Date();
  const endsAt = DateTime.fromJSDate(startedAt).plus({
    seconds: timeoutSeconds,
  });
  await rummyGameplayCacheService.updateTimerValue(roomId, endsAt);
  timers[roomId] = setTimeout(() => {
    console.log(
      "---------Turn timer in start turn timer function------------------------>>>",
      endsAt
    );
    handleGameTimeOver(roomId, currentPlayerId);
  }, timeoutSeconds * 1000);
}

//**************** */
async function startSubmitTimer(roomId, currentPlayerId) {
  console.log(
    "Room id in submit timer-------->",
    roomId,
    "CurrentPlayer---->",
    currentPlayerId
  );
  roomTimer[roomId] = setInterval(async () => {
    let roomData = await rummyRoomCacheService.getRoomData(roomId);

    console.log("Submit timers inside a room", roomData.submitTimer);

    let time = roomData.submitTimer;

    if (time === 0) {
      clearInterval[roomTimer[roomId]];

      handleGameTimeOver(roomId, currentPlayerId);
    } else {
      time--;
      await rummyRoomCacheService.updateSubmitTimer(
        roomData,
        roomData.submitTimer - 1
      );
      let roomTimer = await rummyRoomCacheService.getRoomData(roomData.roomId);
      console.log("update Submit Timer -->", roomTimer.submitTimer);
      emit(roomId, "submitTimer", { time: roomTimer.submitTimer });
    }
  }, 1000);
}

//*************** */
async function startJoiningTimer(room, io, socket) {
  console.log("Number of players in start joining timer", room.noOfPlayers);

  roomTimer[room.roomId] = setInterval(async () => {
    let roomData = await rummyRoomCacheService.getRoomData(room.roomId);

    console.log("Players joined inside room--->", roomData.players.length);

    let time = roomData.joiningTimer;
    console.log("Timer i have-->", time);

    if (time === 0) {
      clearInterval(roomTimer[roomData.roomId]);

      if (roomData.noOfPlayers === 2) {
        if (roomData.players.length === roomData.noOfPlayers) {
          await rummyRoomCacheService.setGameStarted(roomData);
          await initGame(roomData, io);
        } else {
          emit(room.roomId, "remitJoined", { message: "No match found" });
          console.log("Room has been removed", roomData.roomId);
          await rummyGameplayCacheService.deleteRoom(roomData.roomId);
        }
      } else {
        console.log("For more than 2 players", roomData.players.length);
        if (
          roomData.players.length >= 2 &&
          roomData.players.length <= roomData.noOfPlayers
        ) {
          console.log("going to start game");
          await rummyRoomCacheService.setGameStarted(roomData);
          await initGame(roomData, io);
        } else {
          emit(room.roomId, "remitJoined", { message: "No match found" });
          console.log("Room has been removed", roomData.roomId);
          await rummyGameplayCacheService.deleteRoom(roomData.roomId);
        }
      }
    } else {
      time--;
      await rummyRoomCacheService.updatejoiningTimer(
        roomData,
        roomData.joiningTimer - 1
      );
      let roomTimer = await rummyRoomCacheService.getRoomData(roomData.roomId);
      console.log("updatejoiningTimer-->", roomTimer.joiningTimer);
      // room.joiningTimer = room.joiningTimer - 1
      // console.log("Timer--->" , room.joiningTimer)
      emit(room.roomId, "countdown", { time: roomTimer.joiningTimer });
    }
  }, 1000);
}

async function handleGameTimeOver(roomId, currentPlayerId) {
  console.log(
    "----------------------Entered into handle Game Time Over----------------------------",
    currentPlayerId
  );
  const room = await rummyGameplayCacheService.getRoomData(roomId);
  if (!room) {
    return;
  }
  console.log(
    "Room's Current players submitted---->",
    room.isCurrentPlayersSubmitted,
    "room",
    room.roomId,
    "CurrentPlayer",
    room.currentPlayer.userId
  );
  if (room.isCurrentPlayersSubmitted) {
    const notSubmittedPlayers = room.players.filter(
      (e) =>
        !room[getHasSubmittedKey(e.userId)] && !room[getHasDroppedKey(e.userId)]
    );
    console.log(
      "players did not submitted cards",
      room.roomId,
      notSubmittedPlayers.length
    );
    await Promise.all(
      notSubmittedPlayers.map(async (e) => {
        await dropCurrentPlayer(room, e.userId, null, true);
      })
    );
    await calResult(room.roomId, true);
    return;
  }
  if (!room || currentPlayerId !== room.currentPlayer.userId) {
    return;
  }
  console.log("room ka data --->", room.players);
  const currentPlayer = room.players.find(
    (e) => e.userId === room.currentPlayer.userId
  );
  if (!currentPlayer.hasShown) {
    room.currentPlayer.life--;
    currentPlayer.life = room.currentPlayer.life;
    await rummyGameplayCacheService.updateCurrentPlayerLife(
      room,
      room.currentPlayer.life
    );

    await autoDiscardCurrentCard(room, currentPlayer);
  }
  console.log("Going to emit----->");

  emit(roomId, "timeout", {
    userId: room.currentPlayer.userId,
    life: room.currentPlayer.life,
  });

  setTimeout(async () => {
    await nextPlayer(room);
    await rummyGameplayCacheService.updateRoomData(room, { hasShown: false });
  }, 500);

  if (room.currentPlayer.life <= 0 || room.currentPlayer.hasShown) {
    room.currentPlayer.disqualified = true;
    currentPlayer.disqualified = true;
    await rummyGameplayCacheService.disqualifyCurrentPlayer(room);
    await rummyGameplayCacheService.increaseLeftCount(room.roomId);

    emit(roomId, "disqualified", {
      userId: room.currentPlayer.userId,
    });
    // const gameService = require('../services/game-service');
    // await gameService.markAsDisqualified(room, room.currentPlayer.userId, room.currentPlayer.gameplayTokenMd5);
    await dropCurrentPlayer(room, currentPlayer.userId);
  }
}

async function autoDiscardCurrentCard(room, currentPlayer) {
  console.log("Auto Discard------>", currentPlayer);
  if (room.hasPicked) {
    data = {
      card: currentPlayer.cards[currentPlayer.cards.length - 1],
      autoDiscard: 1,
    };
    discardCard(room, data, currentPlayer.userId, () => {});
  }
}

async function checkRemainingPlayers(room, remainingPlayers) {
  // only one left then last is winner

  console.log(
    "What is the rooms left count----->",
    room.leftCount,
    "What is the player length",
    room.players.length
  );
  if (room.leftCount !== room.players.length - 1) {
    if (remainingPlayers === 1) {
      if (
        1 !==
        room.players.filter(
          (e) => !e.disqualified && !room[getHasDroppedKey(e.userId)]
        )
      ) {
        room = await rummyGameplayCacheService.getRoomData(room.roomId);
      }
      const pendingPlayers = room.players.filter(
        (e) => !e.disqualified && !room[getHasDroppedKey(e.userId)]
      );

      console.log(
        "Pending players inside check remaining players--->",
        pendingPlayers
      );
      room.winner = [pendingPlayers[0].userId];
      // if (room.rummyType === constants.RUMMY_TYPE.POOL) {
      await rummyGameplayCacheService.updateRoomData(room, {
        winner: room.winner,
      });
      await calResult(room.roomId);
      return true;
      // }
      // await gameFinished(room);
      // await calResult(room.roomId);

      // return true;c
    }
    return false;
  } else {
    await gameFinished(room, false, true);
  }
}

async function getStat(roomId, room) {
  // console.log("getStat - ", roomId, room);
  if (!room) {
    room = await rummyGameplayCacheService.getRoomData(roomId);
  }
  // console.log("getStat room- ", room);
  if (!room) {
    return null;
  }
  const {
    rummyType,
    maxPoint,
    round,
    hasShown,
    openDeck,
    hasPicked,
    jokerCard,
    jokerCards,
    currentPlayer,
  } = room;
  const timeLeft = calculateTimeLeft(room);
  currentPlayer["timeLeft"] = timeLeft;
  currentPlayer["score"] = room[getScoreKey(currentPlayer.userId)];
  currentPlayer["hasSubmitted"] =
    room[getHasSubmittedKey(currentPlayer.userId)];
  currentPlayer["hasDropped"] = room[getHasDroppedKey(currentPlayer.userId)];
  currentPlayer["autoDrop"] = room[getAutoDropKey(currentPlayer.userId)];
  currentPlayer["isEliminated"] =
    room[getIsEliminatedKey(currentPlayer.userId)];
  if (room.canSplitPrize) {
    currentPlayer.splitPrize = room[getSplitPrizeKey(currentPlayer.userId)];
  }
  return {
    gameStatus: "started",
    roomId,
    rummyType,
    maxPoint,
    round,
    hasShown,
    openDeckLastCards:
      openDeck[0] && openDeck[1] ? [openDeck[0], openDeck[1]] : openDeck,
    hasPicked,
    jokerCard,
    jokerCards,
    currentPlayer,
    players: getPlayers(room),
    timeLeft,
  };
}

function getConfig() {
  return {
    GAME_INIT_COUNTDOWN_DELAY,
    GAME_START_DELAY_SECONDS,
    TURN_TIMER,
    CARD_SUBMIT_TIMER,
    FIRST_DROP_POINTS_80,
    MIDDLE_DROP_POINTS_80,
    FIRST_DROP_POINTS_101,
    MIDDLE_DROP_POINTS_101,
    FIRST_DROP_POINTS_201,
    MIDDLE_DROP_POINTS_201,
  };
}

async function start(room) {
  let playerLength = room.players.filter((e) => e.disqualified !== true);

  if (playerLength.length > 1) {
    if (room.round === 0) {
      emit(room.roomId, "start");
    }

    // room.player
    setTimeout(async () => {
      emit(room.roomId, "stat", await getStat(room.roomId, room));
    }, 2200);
    room.currentPlayer["timeLeft"] = TURN_TIMER;
    setTimeout(() => {
      console.log(
        "What is the Time we are sending while starting round------------------->",
        room.currentPlayer
      );
      emit(room.roomId, "current-player", room.currentPlayer);
    }, 3000);
    // if (room.rummyType === constants.RUMMY_TYPE.POOL) {
    await rummyGameplayCacheService.hIncrBy(room.roomId, "round", 1);
    emit(room.roomId, "round-start");

    // }
    await startTurnTimer(room.roomId, room.currentPlayer.userId);
  }
}

function emit(roomId, event, data) {
  console.log("emit", roomId, event, JSON.stringify(data));
  // global.io.to(roomId)(event, data);
  global.io.to(roomId).emit(event, data);
}

function calScoreOfDropPlayer(room, noOfTurnsTaken) {
  let score;
  if (noOfTurnsTaken > 1) {
    if (room.rummyType === constants.RUMMY_TYPE.POINT) {
      score = MIDDLE_DROP_POINTS_80;
    } else {
      if (room.maxPoint === constants.RUMMY_POINTS.MAX_101) {
        score = MIDDLE_DROP_POINTS_101;
      } else {
        score = MIDDLE_DROP_POINTS_201;
      }
    }
  } else {
    if (room.rummyType === constants.RUMMY_TYPE.POINT) {
      score = FIRST_DROP_POINTS_80;
    } else {
      if (room.maxPoint === constants.RUMMY_POINTS.MAX_101) {
        score = FIRST_DROP_POINTS_101;
      } else {
        score = FIRST_DROP_POINTS_201;
      }
    }
  }
  return score;
}

async function dropCurrentPlayer(room, userId, callback, submitted) {
  const { roomId, currentPlayer, players } = room;
  if (
    (userId !== currentPlayer.userId && !submitted) ||
    room[getHasDroppedKey(userId)]
  ) {
    callback({
      status: "Fail",
      message: "not allowed",
    });
    return;
  }
  const player = players.find((e) => e.userId === userId);
  await rummyGameplayCacheService.updateHasDroppedKey(
    roomId,
    getHasDroppedKey(player.userId),
    true
  );

  room = await rummyGameplayCacheService.getRoomData(roomId);

  console.log("dropped-player", room[getHasDroppedKey(player.userId)]);
  room[getScoreKey(player.userId)] = await rummyGameplayCacheService.hIncrBy(
    roomId,
    getScoreKey(player.userId),
    calScoreOfDropPlayer(room, player.noOfTurnsTaken)
  );
  if (room.rummyType === constants.RUMMY_TYPE.POOL) {
    if (room.maxPoint === constants.RUMMY_POINTS.MAX_101) {
      if (Math.min(101, room[getScoreKey(player.userId)]) === 101) {
        await rummyGameplayCacheService.updateIsEliminatedKey(
          roomId,
          getIsEliminatedKey(userId),
          true
        );
        room.eliminatedPlayers.unshift(userId);
      }
    } else {
      if (Math.min(201, room[getScoreKey(player.userId)]) === 201) {
        await rummyGameplayCacheService.updateIsEliminatedKey(
          roomId,
          getIsEliminatedKey(userId),
          true
        );
        room.eliminatedPlayers.unshift(userId);
      }
    }
  }
  await rummyGameplayCacheService.updateRoomData(room, {
    eliminatedPlayers: room.eliminatedPlayers,
  });
  await rummyGameplayCacheService.hDecrBy(roomId, SUBMIT_COUNTER_KEY, 1);
  console.log(
    "---------------------last Card will be distributed from closed deck------------------------------"
  );

  if (callback) {
    callback({
      status: "Success",
    });
  }
  if (room.canSplitPrize) {
    await rummyGameplayCacheService.hIncrBy(roomId, getDropCountKey(userId), 1);
  }
  if (!submitted) {
    const remainingPlayers = await reduceRemainingPlayers(room.roomId);
    const updatedRoomData = await rummyGameplayCacheService.getRoomData(roomId);
    emit(roomId, "drop", { userId });
    if (await checkRemainingPlayers(updatedRoomData, remainingPlayers)) {
      return;
    }
    await nextPlayer(room);
  }
  emit(roomId, "drop", { userId });
}

async function autoDropPlayer(room, userId, callback) {
  callback({
    status: "Success",
  });
  await rummyGameplayCacheService.updateAutoDropKey(
    room.roomId,
    getAutoDropKey(userId),
    !room[getAutoDropKey(userId)]
  );
  if (room[getAutoDropKey(userId)]) {
    await rummyGameplayCacheService.updateHasDroppedKey(
      room.roomId,
      getHasDroppedKey(userId),
      false
    );
  }
}

async function pickCard(room, data, userId, callback) {
  try {
    let { roomId, currentPlayer, players, openDeck, closedDeck } = room;
    console.log(
      "-------------Open deck is here---------------",
      openDeck,
      "closedDek is here------------",
      closedDeck
    );
    if (userId !== currentPlayer.userId) {
      return callback(
        await response.callbackErrorResponse(0, false, "Mismatched Turn")
      );
    }
    if (!data.deck) {
      callback({
        status: "Fail",
        message: "not allowed due to data",
      });
      return;
    }
    const player = players.find((e) => e.userId === userId);
    // remove card from deck
    let removeCard;

    console.log("Current Player in pick function", currentPlayer);
    if (data.deck === "open") {
      removeCard = openDeck.shift();
    } else {
      if (closedDeck.length != 1) {
        removeCard = closedDeck.shift();
      } else {
        removeCard = closedDeck.shift();
        closedDeck = openDeck;
        openDeck = [];
        await rummyGameplayCacheService.updateRoomData(room, {
          closedDeck,
          openDeck,
        });

        console.log(
          "---------------------last Card will be distributed from closed deck------------------------------"
        );
      }
    }

    console.log("Card going to be added-->", removeCard);

    console.log(
      "Cards in currentPlayer",
      currentPlayer,
      "Player Cards",
      player
    );

    // add removed card to user card array
    currentPlayer.cards.push(removeCard);
    player.cards.push(removeCard);
    player.noOfTurnsTaken++;
    await rummyGameplayCacheService.updateRoomData(room, {
      players,
      currentPlayer,
      openDeck,
      closedDeck,
      hasPicked: true,
    });
    callback({
      status: "Success",
    });
    emit(roomId, "pick", { deck: data.deck, userId, removeCard });
  } catch (err) {
    console.log("Error occured while picking up card----->", err);
  }
}

async function discardCard(room, data, userId, callback) {
  try {
    const { roomId, currentPlayer, players, openDeck } = room;

    // console.log("discard current turn-->" , currentPlayer.userId , "UserId" , userId)
    if (userId !== currentPlayer.userId) {
      callback({
        status: "Fail",
        message: "not allowed due to userId",
      });
    }
    if (!data.card) {
      callback({
        status: "Fail",
        message: "not allowed due to data",
      });
      return;
    }
    if (!room.hasPicked) {
      callback({
        status: "Fail",
        message: "not allowed due to haspicked.",
      });
      return;
    }
    const player = players.find((e) => e.userId === userId);

    console.log("Player in discard function---->", player);
    // check index of card
    const indexOfCard = player.cards.indexOf(data.card);

    console.log("check index of card--->", indexOfCard);

    // const indexOfCard = player.cards.indexOf(data.card);
    if (indexOfCard === -1) {
      callback({
        status: "Fail",
        message: "card not found",
      });
      return;
    }
    //remove discard card form user card array
    currentPlayer.cards.splice(indexOfCard, 1);
    player.cards.splice(indexOfCard, 1);
    // add discarded card to openDeck
    openDeck.unshift(data.card);
    await rummyGameplayCacheService.updateRoomData(room, {
      currentPlayer,
      players,
      openDeck,
      hasPicked: false,
    });
    callback({
      status: "Success",
    });
    emit(roomId, "discard", {
      card: data.card,
      deck: data.deck,
      userId,
      autoDiscard: data.autoDiscard,
    });

    if (data.autoDiscard == 0) await nextPlayer(room);
  } catch (err) {
    console.log("Error occured while discarding--->", err);
  }
}

async function show(room, data, userId, callback) {
  const { roomId, currentPlayer, players } = room;

  if (currentPlayer.userId !== userId) {
    callback({
      status: "Fail",
      message: "Not allowed",
    });
    return;
  }

  clearTimer(roomId);
  currentPlayer.hasShown = true;
  const player = players.find((e) => e.userId === userId);
  player.hasShown = true;
  callback({
    status: "Success",
  });
  await rummyGameplayCacheService.updateRoomData(room, {
    players,
    currentPlayer,
    hasShown: true,
  });
  emit(roomId, "show", {
    card: data.card,
    userName: currentPlayer.userName,
    userId,
  });
  // here i need a console log to check the data
  console.log("show", data.card, currentPlayer.userName, userId);
  await startTurnTimer(roomId, currentPlayer.userId, CARD_SUBMIT_TIMER);
}

async function ValidateUserCards(
  cardDataInResponse,
  cardDataInServer,
  room,
  userId
) {
  let isValidCards = true;
  let allCards = [];

  cardDataInResponse.forEach((cardGroup) => {
    cardGroup.cards.forEach((card) => {
      allCards.push(card);
    });
  });

  isValidCards =
    allCards.filter(
      (x) =>
        cardDataInServer.filter((y) => y === x).length !==
        allCards.filter((z) => z === x).length
    ).length === 0;

  if (isValidCards === false) {
    console.log("Cards are not valid.", isValidCards);
    await rummyGameplayCacheService.disqualifyCurrentPlayer(room);
    await dropCurrentPlayer(room, userId);
  }
}

async function submit(room, data, userId, callback) {
  const { roomId, jokerCards, currentPlayer } = room;
  if (!room.hasShown) {
    callback({
      status: "Fail",
      message: "not allowed",
    });
    return;
  }
  clearTimer(roomId);
  //check submitted group of cards set valid or not

  let roomData = await rummyGameplayCacheService.getRoomData(roomId);
  let playerCards = roomData.players.find((x) => x.userId === userId).cards;
  console.log("player cards--->", playerCards);
  // await ValidateUserCards(data.groups,playerCards,room,currentPlayer.userId);

  var result = cardService.isValidSet(data.groups, jokerCards);
  // var result = {isValid : true}
  console.log("Result is valid in  submit function --->", result);
  console.log(
    "This is i am checking from the background of the sumit function ttttttttttttttttttttttttttyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    result
  );

  if (currentPlayer.userId === userId) {
    console.log("Callback sending--->", !result.isValid);

    // if not valid drop that player
    if (!result.isValid) {
      callback({
        status: "Success",
        data: {
          isValid: result.isValid,
        },
      });
      console.log(roomId, "current-player-placed-wrong-show", userId);
      // await dropCurrentPlayer(room, userId);
      return;
    }
    await rummyGameplayCacheService.updateHasSubmittedKey(
      roomId,
      getHasSubmittedKey(userId),
      true
    );
    await rummyGameplayCacheService.updateRoomData(room, {
      isCurrentPlayersSubmitted: true,
    });
    room[getScoreKey(userId)] = await rummyGameplayCacheService.hIncrBy(
      roomId,
      getScoreKey(userId),
      0
    );
    room.winner = [currentPlayer.userId];

    // await startTurnTimer(roomId , userId )
  }
  await startTurnTimer(roomId, null, CARD_SUBMIT_TIMER);
  console.log("coming out from the if condition");

  const submitCounter = await rummyGameplayCacheService.hDecrBy(
    roomId,
    SUBMIT_COUNTER_KEY,
    1
  );

  if (result.isValid) {
    console.log("Is valid is true at 897");
    emit(roomId, "submit", {
      isValid: true,
      userId,
      userName: currentPlayer.userName,
    });
  }

  console.log("Submit counter----------->", submitCounter);
  if (submitCounter <= 0) {
    clearTimer(roomId);
  }
  callback({
    status: "Success",
    data: {
      isValid: result.isValid,
    },
  });
  emit(roomId, "remitSubmit", { playerId: userId, isValid: result.isValid }); //To show everyone that one player has submit the cards

  // result.isValid = true;
  // console.log("Result is valid or not" , result.isValid)
  if (result.isValid) {
    room[getScoreKey(userId)] = await rummyGameplayCacheService.hIncrBy(
      roomId,
      getScoreKey(userId),
      0
    );
  } else {
    console.log(
      "Rummy type in submit event--->",
      room.rummyType,
      "Max point inside room-->",
      room.maxPoint
    );
    if (room.rummyType === constants.RUMMY_TYPE.POINT) {
      room[getScoreKey(userId)] = await rummyGameplayCacheService.hIncrBy(
        roomId,
        getScoreKey(userId),
        Math.min(
          80,
          cardService.calNotValidCardScore(result.notValidSet, jokerCards)
        )
      );
    } else if (room.rummyType === constants.RUMMY_TYPE.POOL) {
      console.log("Entering for pool mode--->", room.maxPoint);
      if (room.maxPoint === constants.RUMMY_POINTS.MAX_101) {
        const score = await rummyGameplayCacheService.hIncrBy(
          roomId,
          getScoreKey(userId),
          cardService.calNotValidCardScore(result.notValidSet, jokerCards)
        );
        if (Math.min(101, score) === 101) {
          console.log(
            "----------------------Calculating score here---------------------",
            Math.min(101, score)
          );
          await rummyGameplayCacheService.updateIsEliminatedKey(
            roomId,
            getIsEliminatedKey(userId),
            true
          );

          //We are just sending eliminated player id
          emit(room.roomId, "drop", { userId });

          room.eliminatedPlayers.unshift(userId);
        }
      } else {
        console.log("Entering into 201 rummy points-->");
        const score = await rummyGameplayCacheService.hIncrBy(
          roomId,
          getScoreKey(userId),
          cardService.calNotValidCardScore(result.notValidSet, jokerCards)
        );
        if (Math.min(201, score) === 201) {
          console.log(
            "Calculating 201 rummy points Score-->",
            Math.min(201, score)
          );

          await rummyGameplayCacheService.updateIsEliminatedKey(
            roomId,
            getIsEliminatedKey(userId),
            true
          );

          emit(room.roomId, "drop", { userId });

          room.eliminatedPlayers.unshift(userId);
        }
      }
    }
  }
  await rummyGameplayCacheService.updateHasSubmittedKey(
    roomId,
    getHasSubmittedKey(userId),
    true
  );
  await rummyGameplayCacheService.updateRoomData(room, {
    winner: room.winner,
    eliminatedPlayers: room.eliminatedPlayers,
  });
  console.log(
    "--------------------------Directtly going to call result---------------------",
    submitCounter
  );
  // if (submitCounter == 0) {
  //   console.log("calResult called---------->");
  //   await calResult(roomId, true);
  // }

  await calResult(roomId, true);
} //result will be declare from here

async function calResult(roomId, submit) {
  console.log("Calling Cal result-------------->");
  const updatedRoomData = await rummyGameplayCacheService.getRoomData(roomId);

  console.log("updated Room data after submit and next result--->",updatedRoomData.rummyType);
  // console.log(
  //   "Winner array in updated room",
  //   updatedRoomData.winner,
  //   " players length--> ",
  //   updatedRoomData.players,
  //   "Price",
  //   updatedRoomData
  // );

  console.log("sdasdjdndlksadl lkkmlml--->>",updatedRoomData.rummyType)

  console.log("check both are true", updatedRoomData.rummyType === constants.RUMMY_TYPE.POINT, )

  if (updatedRoomData.rummyType === constants.RUMMY_TYPE.POINT) {

    console.log("Amal Francis--->", )

    const submitPlayers = [];


    let price = 0;
    // for(let element of updatedRoomData.players){
    //    price += updatedRoomData[getScoreKey(element.userId)] * updatedRoomData.rupeePerPoint;
    // }
    // updatedRoomData["price"] = price;
    let activePlayer = updatedRoomData.players.find(
      (player) => !player.disqualified
    );

    try {
      console.log("Active Player--->", activePlayer);
      if (!activePlayer || !activePlayer.token) {
        throw new Error("Active player or token is not defined");
      }
    
      if (!updatedRoomData || !updatedRoomData.tournamentId) {
        throw new Error("Updated room data or tournamentId is not defined");
      }
    
      let tableExists = await requestAPI.fetchTable("/api/v1/games/get_rummy_config", {
        token: activePlayer.token,
        tournamentId: updatedRoomData.tournamentId,
      });
    
      // console.log("Table Exists--->", tableExists);
    } catch (error) {
      console.error("Error fetching table:", error);
    }

    // updatedRoomData["price"] = tableExists.win_amount;
     updatedRoomData["price"] = 200
    console.log(
      "Room Price in  updated room cal result --->",
      updatedRoomData["price"]
    );
    for (let i = 0; i < updatedRoomData.players.length; i++) {
      let obj = {};

      obj["userId"] = updatedRoomData.players[i].userId;
      obj["userName"] = updatedRoomData.players[i].userName;
      obj["profileImageUrl"] = updatedRoomData.players[i].profileImageUrl;
      obj["score"] =
        updatedRoomData[getScoreKey(updatedRoomData.players[i].userId)];
      obj["cards"] = updatedRoomData.players[i].cards;
      if (
        updatedRoomData[
          getIsEliminatedKey(updatedRoomData.players[i].userId)
        ] === true
      ) {
        obj["status"] = "ELIMINATED";
      }
      if (
        updatedRoomData.winner.indexOf(updatedRoomData.players[i].userId) === 0
      ) {
        obj["hasWin"] = true;
        obj["status"] = "WIN";
        obj["resultAmount"] = `+${updatedRoomData.price}`;
      } else {
        obj["hasWin"] = false;
        obj["status"] = "LOSE";
        obj["resultAmount"] = `-${updatedRoomData.price}`;
      }
      if (
        updatedRoomData[getHasDroppedKey(updatedRoomData.players[i].userId)] ===
        true
      ) {
        obj["status"] = "DROP";
      }
      submitPlayers.push(obj);
    }
    // emit(roomId, "submit", { isValid: true, players: submitPlayers });
    console.log("going to call game finished");
    if (submit) {
      emit(roomId, "submit", { isValid: true, players: submitPlayers });
    }
    emit(roomId, "round-end", { isValid: true, players: submitPlayers });
    const pendingPlayers = updatedRoomData.players.filter(
      (e) => !updatedRoomData[getIsEliminatedKey(e.userId)]
    );
    console.log("Pending players length in point--->", pendingPlayers.length);
    if (pendingPlayers.length <= 1) {
      await gameFinished(updatedRoomData, false, false);
    } else {
      nextRound(updatedRoomData);
    }

    // await gameFinished(updatedRoomData);
    // return;
  } else if (updatedRoomData.rummyType === constants.RUMMY_TYPE.POOL) {
    const submitPlayers = [];
    let price = 0;
    // for(let element of updatedRoomData.players){
    //   price += updatedRoomData[getScoreKey(element.userId)] * updatedRoomData.rupeePerPoint;
    // }
    // updatedRoomData["price"] = price;
    let activePlayer = updatedRoomData.players.find(
      (player) => !player.disqualified
    );
    let tableExists = await requestAPI.fetchTable("/api/v1/games/get_rummy_config", {
      token: activePlayer.token,
      tournamentId: updatedRoomData.tournamentId,
    });

    updatedRoomData["price"] = tableExists.win_amount;
    console.log(
      "Room Price in else updated room--->",
      updatedRoomData["price"]
    );
    for (let i = 0; i < updatedRoomData.players.length; i++) {
      let obj = {};

      if (
        updatedRoomData[getHasDroppedKey(updatedRoomData.players[i].userId)] ===
        true
      ) {
        obj["status"] = "DROP";
      }
      obj["userId"] = updatedRoomData.players[i].userId;
      obj["userName"] = updatedRoomData.players[i].userName;
      obj["profileImageUrl"] = updatedRoomData.players[i].profileImageUrl;
      obj["score"] =
        updatedRoomData[getScoreKey(updatedRoomData.players[i].userId)];
      obj["isEliminated"] =
        updatedRoomData[getIsEliminatedKey(updatedRoomData.players[i].userId)];
      if (
        updatedRoomData.winner.indexOf(updatedRoomData.players[i].userId) === 0
      ) {
        obj["hasWin"] = true;
        obj["status"] = "WIN";
        obj["resultAmount"] = `+${updatedRoomData.price}`;
      } else {
        obj["hasWin"] = false;
        obj["status"] = "LOSE";
        obj["resultAmount"] = `-${updatedRoomData.price}`;
      }
      if (
        updatedRoomData[
          getIsEliminatedKey(updatedRoomData.players[i].userId)
        ] === true
      ) {
        obj["status"] = "ELIMINATED";
      }

      //For Left Player
      //  if(updatedRoomData.players.map((pl) => {
      //   if(pl.disqualified === false){
      //     obj["hasWin"] = false;
      //     obj["status"] = "LOSE"
      //     obj["resultAmount"] = `-${updatedRoomData.price}`
      //   }else{
      //     obj["hasWin"] = true;
      //     obj["status"] = "WIN";
      //     obj["resultAmount"] = `+${updatedRoomData.price}`
      //   }
      //  }))
      //  obj["hasWin"] =  updatedRoomData.winner.indexOf(updatedRoomData.players[i].userId) === 0 ? true : false
      obj["cards"] = updatedRoomData.players[i].cards;
      submitPlayers.push(obj);
    }
    if (submit) {
      emit(roomId, "submit", { isValid: true, players: submitPlayers });
    }
    emit(roomId, "round-end", { isValid: true, players: submitPlayers });
    const pendingPlayers = updatedRoomData.players.filter(
      (e) => !updatedRoomData[getIsEliminatedKey(e.userId)]
    );
    console.log("Pending players length--->", pendingPlayers.length);
    if (pendingPlayers.length <= 1) {
      await gameFinished(updatedRoomData.false, false);
    } else {
      nextRound(updatedRoomData);
    }
  }
}

async function nextRound(room) {
  console.log("Room in next round", room);
  let { players, roomId } = room;

  let roomData = await rummyGameplayCacheService.getRoomData(roomId);

  console.log(
    "RoomData",
    roomData,
    "Players length who didn't left------------>",
    players.filter((e) => e.disqualified !== true)
  );

  let playerLength = roomData.players.filter((e) => e.disqualified !== true);

  console.log("how many players are left--->", playerLength.length);
  if (playerLength.length > 1) {
    const nextRoundPlayers = roomData.players.filter(
      (e) => !roomData[getIsEliminatedKey(e.userId)] && e.disqualified !== true
    );

    roomData.players.forEach((element) => {
      element.life = 3;
    });

    const nextRoundCardData = cardService.cardDistribution(
      JSON.parse(JSON.stringify(deckOfCards)),
      13,
      nextRoundPlayers.length
    );

    console.log("What is next round card data---->", nextRoundCardData);
    if (roomData.winner.length !== 0) {
      roomData.currentPlayer = roomData.players.find(
        (e) => e.userId === roomData.winner[0]
      );
    }
    for (let i = 0; i < nextRoundPlayers.length; i++) {
      if (nextRoundPlayers[i].userId === room.currentPlayer.userId) {
        console.log(
          "What is the Current Player data------------->",
          roomData.currentPlayer
        );
        roomData.currentPlayer.cards = nextRoundCardData[`player${i}`];
        roomData.currentPlayer["timeLeft"] = TURN_TIMER;
      }
      nextRoundPlayers[i].cards = nextRoundCardData[`player${i}`];
      nextRoundPlayers[i].noOfTurnsTaken = 0;
      nextRoundPlayers[i].timeLeft = TURN_TIMER;

      await rummyGameplayCacheService.updateHasDroppedKey(
        roomData.roomId,
        getHasDroppedKey(nextRoundPlayers[i].userId),
        false
      );
      await rummyGameplayCacheService.updateAutoDropKey(
        roomData.roomId,
        getAutoDropKey(nextRoundPlayers[i].userId),
        false
      );
      await rummyGameplayCacheService.updateHasSubmittedKey(
        roomData.roomId,
        getHasSubmittedKey(nextRoundPlayers[i].userId),
        false
      );
      nextRoundPlayers[i].hasShown = false;
    }
    await rummyGameplayCacheService.updateRoomData(room, {
      jokerCard: nextRoundCardData.jokerCard,
      jokerCards: nextRoundCardData.jokerCards,
      closedDeck: nextRoundCardData.closeDeck,
      hasPicked: false,
      hasShown: false,
      disqualified: false,
      isCurrentPlayersSubmitted: false,
      winner: [],
      players: nextRoundPlayers,
      leftCount: roomData.leftCount,
      currentPlayer: roomData.currentPlayer,
      [SUBMIT_COUNTER_KEY]: nextRoundPlayers.length,
      [REMAINING_PLAYERS_KEY]: nextRoundPlayers.length,
    });
    setTimeout(async () => {
      const updatedRoomData = await rummyGameplayCacheService.getRoomData(
        roomData.roomId
      );
      start(updatedRoomData);
    }, GAME_INIT_COUNTDOWN_DELAY * 1000);
  } else {
    console.log("-------Only one player left in a room");
    clearTimer(roomData.roomId);

    emit(roomData.roomId, "game-finished", { players: roomData.players });

    setTimeout(async () => {
      await rummyGameplayCacheService.deleteRoom(roomData.roomId);
    }, 2000);
    // roomData = await rummyGameplayCacheService.getRoomData(roomId);
    // await gameFinished(roomData);
  }
}

async function validate(room, data, callback) {
  // console.log("DATa in validate--->" , data , "room", room);
  const { jokerCards } = room;
  const set = cardService.validateCards(data.groups, jokerCards);

  // console.log("Set in Validate --->" , set)

  callback({
    status: "Success",
    data: {
      groups: set,
    },
  });
}

async function splitPrize(room, userId, callback) {
  if (!room.canSplitPrize) {
    callback({
      status: "Fail",
      message: "not allowed",
    });
    return;
  }
  const eliminatedPlayers = room.players.filter(
    (e) => room[getIsEliminatedKey(e.userId)]
  );
  if (eliminatedPlayers.length < 3) {
    callback({
      status: "Fail",
      message: "not allowed",
    });
    return;
  }
  await rummyGameplayCacheService.updateSplitPrizeKey(
    room.roomId,
    getSplitPrizeKey(userId),
    !room[getSplitPrizeKey(userId)]
  );
  if (!room[getSplitPrizeKey(userId)]) {
    room[SPLIT_PRIZE_COUNTER_KEY] = await rummyGameplayCacheService.hIncrBy(
      room.roomId,
      SPLIT_PRIZE_COUNTER_KEY,
      1
    );
  }
  const remainingPlayers = room.players.filter(
    (e) => !room[getIsEliminatedKey(e.userId)]
  );
  if (room[SPLIT_PRIZE_COUNTER_KEY] === remainingPlayers.length) {
    await gameFinished(room, true, false);
  }
}

async function gameFinished(room, prizeSplitted, leftStatus) {
  room.endTime = new Date().toISOString();
  const { roomId } = room;
  const req = requestTemplate.generateRequestObject(room.roomId);
  const players = [];
  clearTimer(roomId);
  var status, ranking, winBoolean;

  console.log("What is the left Status----------->", leftStatus);

  if (leftStatus === true) {
    room.players.forEach((e) => {
      if (e.disqualified === true) {
        winBoolean = false;
        (status = "LOSE"), (e["hasWin"] = "LOSE");
      } else {
        winBoolean = true;
        (status = "WIN"), (e["hasWin"] = "WIN");
      }
      players.push({
        socketId: e.socketId,
        userId: e.userId,
        cards: e.cards,
        userName: e.userName,
        profileImageUrl: e.profileImageUrl,
        score: room[getScoreKey(e.userId)],
        hasWin: winBoolean,
        status: status,
        // hasWin: room.winner.indexOf(e.userId) === 0 ? true : false,
      });
      // e.hasWin = room.winner.indexOf(e.userId) === 0 ? true : false;
      e.score = room[getScoreKey(e.userId)];
    });
  } else {
    room.winner.forEach((e) => {
      console.log("Socket id in game finised", e);
      if (room.winner.indexOf(e.userId) === 0) {
        winBoolean = true;
        status = "WIN";
      } else {
        winBoolean = false;
        status = "LOSE";
      }
      players.push({
        socketId: e.socketId,
        userId: e.userId,
        cards: e.cards,
        userName: e.userName,
        profileImageUrl: e.profileImageUrl,
        score: room[getScoreKey(e.userId)],
        hasWin: winBoolean,
        status: status,
        // hasWin: room.winner.indexOf(e.userId) === 0 ? true : false,
      });
      // e.hasWin = room.winner.indexOf(e.userId) === 0 ? true : false;
      e.score = room[getScoreKey(e.userId)];
    });
  }

  if (room.tournamentId) {
    // let price = 0;
    // players.forEach((e) => {
    //   price += e.score * room.rupeePerPoint;
    // });

    let activePlayers = room.players.find((pl) => !pl.disqualified);
    console.log("activePlayers", activePlayers);
    let tableExists = await requestAPI.fetchTable("/api/v1/get_rummy_config", {
      token: activePlayers.token,
      tournamentId: room.tournamentId,
    });

    // let tableData = await tableQuery.getTabl/e({_id : room?.tournamentId});

    console.log("Tournament win amount--->", tableExists.win_amount);
    room.price = tableExists.win_amount;
    // try {
    //   const response = await requestTemplate.get(
    //     req,
    //     constants.SERVICES.game,
    //     `/mgp-game/api/v1/battles/${room.battleId}`
    //   );
    //   room.entryFees = tableData.entry_fee;
    //   if (room.rummyType === constants.RUMMY_TYPE.POOL) {
    //     // const adminFees =
    //     //   (response.data.result.adminComisionPerUser *
    //     //     response.data.result.entryFees *
    //     //     response.data.result.totalPlayersToAllow) /
    //     //   100;
    //     // room.price =
    //     //   response.data.result.entryFees * room.players.length - adminFees;
    //     //if prize splitted distribute prize with all remaining players
    //     if (prizeSplitted) {
    //       const remainingPlayers = room.players.filter(
    //         (e) => room[getIsEliminatedKey(e.userId)] === false
    //       );
    //       //prize which is cal using no. of drop use by players and entry fee
    //       let givenPrize = 0;
    //       room = await rummyGameplayCacheService.getRoomData(roomId)
    //       room.players.forEach((e) => {
    //         if (!room[getIsEliminatedKey(e.userId)]) {
    //           let remainingDrops = 3 - room[getDropCountKey(e.userId)];
    //           e.price = Math.max(0, remainingDrops) * tableData.point_value;
    //           givenPrize += e.price;
    //         }
    //       });
    //       //reduce given prize from prize pool
    //       const remainingPrizePool = Math.max(0, room.price - givenPrize);
    //       room.winner = [];
    //       // if prizePool is 0
    //       if (remainingPrizePool === 0) {
    //         let distributedPrize = room.price;
    //         room.players.forEach((e) => {
    //           if (!room[getIsEliminatedKey(e.userId)]) {
    //             if (e.price < distributedPrize) {
    //               distributedPrize -= e.price;
    //               room.winner.push(e.price);
    //             } else {
    //               if (distributedPrize) {
    //                 e.price = distributedPrize;
    //                 distributedPrize -= e.price;
    //                 room.winner.push(e.price);
    //               } else {
    //                 e.price = 0;
    //                 room.eliminatedPlayers.unshift(e.userId);
    //               }
    //             }
    //           }
    //         });
    //         //if prizePool is grater than 0
    //       } else {
    //         const remainingPrizePoolDistribution =
    //           remainingPrizePool / remainingPlayers.length;
    //         room.players.forEach((e) => {
    //           if (!room[getIsEliminatedKey(e.userId)]) {
    //             e.price += remainingPrizePoolDistribution;
    //             room.winner.push(e.price);
    //           }
    //         });
    //       }
    //       room.winner.sort(function (a, b) {
    //         return b - a;
    //       });
    //     }
    //   } else {
    //     const adminFees =
    //       (room.price * tableData.admin_commission) / 100;
    //     room.price -= adminFees;
    //   }
    // } catch (error) {
    //   // eslint-disable-next-line no-console
    //   console.error(
    //     `Error while fetching price, battleId: ${room.battleId}`,
    //     error.toJSON ? error.toJSON() : error
    //   );
    // }
    console.log(
      " Finally going to finish the game------>",
      room,
      "Players - ",
      room.players,
      "Room price---->",
      room.price
    );
    let player = [];
    room.players.forEach((e) => {
      // if(e.price > 0) {
      //   ranking = 1;
      //   status = "WIN"
      // }else{
      //   ranking = 0;
      //   status = "LOSE"
      // }
      let playerData = {
        id: e.id,
        rank: e.price > 0 ? 1 : 0,
        fees: room.entryFees,
        pl: e.price,
        is_active: true,
      };
      player.push(playerData);
    });
    // await Room.create([
    //   {
    //     room: room.roomId,
    //     room_type: room.rummyType,
    //     no_of_players: room.players.length,
    //     game_completed_at: Date.now(),
    //     created_date: Date.now(),
    //     room_fee:  room.entryFees,
    //     players: player,
    //   }
    // ]);
    console.log("GAME FINISHED 0", players);

    //Loop for attaching winning amount to the result
    for (let element of players) {
      if (element.hasWin === true) {
        element["resultAmount"] = `+${room.price}`;
      } else {
        element["resultAmount"] = `-${room.price}`;
      }
    }
    emit(roomId, "game-finished", { players: players, price: room.price });
  } else {
    console.log("ELSE GAME FINISH -----", room, "Players - ", room.players);
    let player = [];
    room.players.forEach((e) => {
      // if(e.score > 0) {
      //   ranking = 1;
      //   status = "WIN"
      // }else{
      //   ranking = 0;
      //   status = "LOSE"
      // }
      let playerData = {
        id: e.id,
        rank: e.score > 0 ? 1 : 0,
        fees: 1, //room.entryFees,
        pl: e.score > 0 ? 1.5 : 0,
        is_active: true,
      };
      player.push(playerData);
    });
    // await Room.create([
    //   {
    //     room: room.roomId,
    //     room_type: room.rummyType,
    //     no_of_players: room.players.length,
    //     game_completed_at: Date.now(),
    //     created_date: Date.now(),
    //     room_fee: 1,
    //     players: player,
    //     game_started_at:  new Date(room.startTime).getTime(),
    //     created_at:  new Date(room.startTime).getTime()
    //   }
    // ]);
    console.log("GAME FINISHED 1", players);
    emit(roomId, "game-finished", { players: players });
  }
  if (prizeSplitted) {
    await publishGamePlayEvent(room, true);
  } else {
    await publishGamePlayEvent(room);
  }
  await rummyGameplayCacheService.deleteRoom(room.roomId);
  setTimeout(() => {
    global.io.to(roomId).disconnectSockets(true);
  }, 15000); // keep 15 sec delay to disconnect so that last events get time to emit
}

async function publishGamePlayEvent(room) {
  try {
    // const req = requestTemplate.generateRequestObject(room.roomId);
    if (
      room.winner.length !== 0 &&
      room.rummyType === constants.RUMMY_TYPE.POINT
    ) {
      const winner = room.players.filter((e) => e.userId === room.winner[0]);
      const remainingPlayers = room.players.filter(
        (e) => e.userId !== room.winner[0]
      );
      remainingPlayers.sort((a, b) =>
        a.score > b.score ? 1 : b.score > a.score ? -1 : 0
      );
      const players = winner.concat(remainingPlayers);
      room.players = players;
    }
    //  await sender.emit(req, 'game-play-update', {
    //     roomId: room.roomId,
    //     startTime: room.startTime,
    //     endTime: room.endTime,
    //     battleId: room.battleId,
    //     tournamentId: room.tournamentId,
    //     gameId: room.gameId,
    //     price: room.price,
    //     rupeePerPoint: room.rupeePerPoint,
    //     rummyType: room.rummyType,
    //     players: room.players.map((e, index) => {

    //         if(room.rummyType === constants.RUMMY_TYPE.POINT){
    //             return {
    //                 userId: e.userId,
    //                 rank: index + 1 ,
    //                 time: null,
    //                 score: e.score,
    //                 hasWin: e.hasWin,
    //                 gameplayTokenMd5: e.gameplayTokenMd5,
    //                 entryFees: room.battleId ? e.score * room.rupeePerPoint : null
    //             };
    //         }else{
    //             if(prizeSplitted){
    //                 return {
    //                     userId: e.userId,
    //                     rank: room.winner.indexOf(e.price) !== -1 ? room.winner.indexOf(e.price)  + 1 : room.eliminatedPlayers.indexOf(e.userId) + room.winner.length + 1 ,
    //                     time: null,
    //                     score: e.score,
    //                     hasWin: false,
    //                     gameplayTokenMd5: e.gameplayTokenMd5,
    //                     price: e.price ? e.price : null
    //                 };
    //             }else{
    //                 return {
    //                     userId: e.userId,
    //                     rank: e.hasWin ? 1 : room.eliminatedPlayers.indexOf(e.userId) + 2 ,
    //                     time: null,
    //                     score: e.score,
    //                     hasWin: e.hasWin,
    //                     gameplayTokenMd5: e.gameplayTokenMd5,
    //                 };
    //             }
    //         }

    //     }),
    //  }, constants.SERVICES.game);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishGamePlayEvent", room.roomId, error);
  }
}

async function nextPlayer(room) {
  console.log("Going inside next player.");
  const currentPlayer = room.currentPlayer;
  let nextPlayerIndex =
    1 + room.players.findIndex((e) => e.userId === currentPlayer.userId);
  console.log("Next player is ", nextPlayerIndex);
  if (nextPlayerIndex === room.players.length) {
    nextPlayerIndex = 0;
  }
  let i = 0;
  while (
    room.players[nextPlayerIndex].disqualified ||
    room[getHasDroppedKey(room.players[nextPlayerIndex].userId)] ||
    room[getIsEliminatedKey(room.players[nextPlayerIndex].userId)]
  ) {
    nextPlayerIndex++;
    if (nextPlayerIndex >= room.players.length) {
      nextPlayerIndex = 0;
    }
    i++;
    if (i > 6) {
      // eslint-disable-next-line no-console
      console.log(
        "Unexpected behavior, game seems to be finished",
        JSON.stringify(room)
      );
      return;
    }
  }
  room.currentPlayer = room.players[nextPlayerIndex];
  if (room[getAutoDropKey(room.currentPlayer.userId)]) {
    await dropCurrentPlayer(room, room.currentPlayer.userId);
    console.log(
      room.roomId,
      "auto drop player true",
      room.currentPlayer.userId
    );
    return;
  }
  await rummyGameplayCacheService.updateCurrentPlayer(room, room.currentPlayer);
  console.log(
    "What is time we will send to next player-------------->",
    TURN_TIMER
  );
  room.currentPlayer.timeLeft = TURN_TIMER;
  emit(room.roomId, "current-player", room.currentPlayer);
  await startTurnTimer(room.roomId, room.currentPlayer.userId);
}

async function leaveGame(roomId, userId, callback) {
  let room = await rummyGameplayCacheService.getRoomData(roomId);

  console.log("Room in leave game------------->", room);
  const player =
    room && room.players && room.players.find((e) => e.userId === userId);

  if (room) {
    if (!player) {
      callback({
        status: "Fail",
        message: "player doesn't Exists",
        meta: "player doesn't Exists",
      });
      return;
    }

    emit(room.roomId, "player-removed", {
      userId: player.userId,
    });

    emit(room.roomId, "player-left", {
      userId: player.userId,
    });

    // await rummyRoomCacheService.removeUserFromRoom(
    //   roomId,
    //   userId
    // );

    await rummyRoomCacheService.removeUserRoom(userId);

    if (
      room &&
      room.players &&
      room.players.filter((e) => !e.disqualified).length == 1
    ) {
      callback({
        status: "Fail",
        message: "You are the last player",
        meta: "You are the last player",
      });
      return;
    }
    player.disqualified = true;

    if (player.userId === room.currentPlayer.userId) {
      console.log(
        "--------------Current player left the room--------------------"
      );
      room.currentPlayer.disqualified = true;
      await rummyGameplayCacheService.disqualifyCurrentPlayer(room);
      await rummyGameplayCacheService.increaseLeftCount(room.roomId);
    } else {
      await rummyGameplayCacheService.disqualifyPlayer(room, userId);
      await rummyGameplayCacheService.increaseLeftCount(room.roomId);
    }
    if (!room[getHasDroppedKey(userId)]) {
      console.log(
        "----------------------Drop nhi h ..toh m krne jara hu ---------------------------------"
      );
      await rummyGameplayCacheService.updateHasDroppedKey(
        room.roomId,
        getHasDroppedKey(userId),
        true
      );
      await rummyGameplayCacheService.hIncrBy(
        roomId,
        getScoreKey(userId),
        calScoreOfDropPlayer(room, player.noOfTurnsTaken)
      );
      await rummyGameplayCacheService.hDecrBy(roomId, SUBMIT_COUNTER_KEY, 1);
    }
    if (
      room.rummyType === constants.RUMMY_TYPE.POOL &&
      !room[getIsEliminatedKey(userId)]
    ) {
      console.log(
        "--------Someone is eliminated already-----------------------"
      );
      await rummyGameplayCacheService.updateIsEliminatedKey(
        roomId,
        getIsEliminatedKey(userId),
        true
      );
      room.eliminatedPlayers.unshift(userId);
      await rummyGameplayCacheService.updateRoomData(room, {
        eliminatedPlayers: room.eliminatedPlayers,
      });
    }
    callback({
      status: "Success",
    });
    console.log(
      "Going to transmit player-left event--------------------------------------------------------> ",
      player,
      "roomId",
      roomId
    );

    // io.to(roomId).emit("player-removed", {
    //   // player: {
    //     userId: player.userId,
    //   // },
    // });

    // io.to(roomId).emit("player-left", {
    //   // player: {
    //     userId: player.userId,
    //   // },
    // });

    room = await rummyGameplayCacheService.getRoomData(roomId);

    console.log(
      "User dropped---->",
      room[getHasDroppedKey(userId)],
      "Left Count-------->",
      room.leftCount
    );

    if (room[getHasDroppedKey(userId)] === true) {
      const remainingPlayers = await reduceRemainingPlayers(room.roomId);
      // eslint-disable-next-line no-console
      console.log(room.roomId, "remainingPlayers", remainingPlayers);
      if (await checkRemainingPlayers(room, remainingPlayers)) {
        return;
      }
    }
    if (player.userId === room.currentPlayer.userId) {
      console.log(
        "Current player will change the round---------------------------------"
      );
      await nextPlayer(room);
    }
  } else {
    console.log("Entered into else , because we dont have gameplay data ");
    let playerExistence = await rummyRoomCacheService.getUserRoom(userId);
    await rummyRoomCacheService.removeUserFromRoom(roomId, userId);

    io.to(playerExistence.roomId).emit("player-removed", {
      userId: userId,
    });

    io.to(playerExistence.roomId).emit("player-left", {
      userId: userId,
    });
  }
}

async function reduceRemainingPlayers(roomId) {
  return rummyGameplayCacheService.hDecrBy(roomId, REMAINING_PLAYERS_KEY, 1);
}

function sanitizeCallback(callback) {
  if (callback) {
    return callback;
  }
  return () => {
    //
  };
}

module.exports = {
  initGame,
  getStat,
  start,
  leaveGame,
  getConfig,
  sanitizeCallback,
  calculateTimeLeft,
  // startSubmitTimer,
  gameFinished,
  emit,
  dropCurrentPlayer,
  autoDropPlayer,
  pickCard,
  discardCard,
  startJoiningTimer,
  show,
  submit,
  validate,
  splitPrize,
  getScoreKey,
  getAutoDropKey,
  getDropCountKey,
  getHasDroppedKey,
  getHasSubmittedKey,
  getIsEliminatedKey,
  getSplitPrizeKey,
  startCountdown,
  calResult,
};
