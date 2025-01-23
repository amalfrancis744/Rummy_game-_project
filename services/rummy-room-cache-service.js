/* eslint-disable no-console */
const redisService = require("./redis-service")("mgp-rummy:room-cache");

async function debugGameData() {
  try {
    return redisService.getAll("*", 1);
  } catch (error) {
    console.error("debugGameData", error);
    throw error;
  }
}

async function getRoomData(roomId) {
  try {
    console.log("room id for hGetAll --->" , roomId)
    return redisService.hGetAll(roomId);
  } catch (error) {
    console.error("getRoomData", error);
    throw error;
  }
}



async function getUserRoom(userId) {
  try {
    const roomId = await redisService.get(`u${userId}`);
    if (roomId) {
      return getRoomData(roomId);
    }
  } catch (error) {
    console.error("getUserRoom", error);
    throw error;
  }
}

async function addUserRoom(room, userId) {
  console.log("add user in room",);
  try {
    return redisService.set(`u${userId}`, room.roomId);
  } catch (error) {
    console.error("addUserRoom", error);
    throw error;
  }
}

async function removeUserRoom(userId) {
  try {
    console.log("Entered into remove User Room---------->>>>", userId)
    return redisService.del(`u${userId}`);
  } catch (error) {
    console.error("removeUserRoom", error);
    throw error;
  }
}

//Check Room Availability
async function getAvailableRoom(payload) {
  console.log("-------------Get Available room ---------------> " , payload)
  try {
    const pattern = payload.tournamentId ? "rt*" : "rb*";
    const rooms = await redisService.hGetAllEach(pattern);
    return rooms.find(

      (room) =>
        
          !room.isGameStarted &&
           ((room.tournamentId === payload.tournamentId)) &&
          room.noOfPlayers === payload.noOfPlayers &&
           room.noOfPlayers > room.players.length &&
           !room.players.some((player) => player.userId === payload.userId)
      
    );
  } catch (error) {
    console.error("getAvailableRoom", error);
    throw error;
  }
}

async function roomAvailablityforPrivate(payload) {
  console.log("-------------Get Available room for Privates---------------> " , payload)
  try {
    const pattern = payload.tournamentId ? "rt*" : "rb*";
    const rooms = await redisService.hGetAllEach(pattern);
    let flag = false , dataShared ;
    for (let i = 0; i < rooms.length; i++)  {
      console.log("Room --->",rooms[i])
      if(rooms[i].roomCode === payload.roomCode && rooms[i].isGameStarted === false && rooms[i].players.length < payload.noOfPlayers && !rooms[i].players.some((player) => player.userId === payload.userId)){
        console.log("Condition true");
        flag=true;
        dataShared = rooms[i];
        break;
      }
    }
    console.log("FLAG--->",flag)
    if(flag){
      return dataShared
    }else{
      return dataShared = undefined
    }
  } catch (error) {
    console.error("roomAvailablityforPrivate", error);
    throw error;
  }
}

//Create New room
async function newRoom(room) {
  console.log("in create new room", room);
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

//Insert Players
async function setRoomPlayers(roomId, players) {
  console.log("in set room players", roomId, players);
  try {
    await redisService.hSet(roomId, "players", players);
  } catch (error) {
    console.error("setRoomPlayers", error);
    throw error;
  }
}

//Remove a player
async function removeUserFromRoom(roomId, userId) {
  console.log("remove table", roomId, userId);
  try {
    const players = await redisService.hGet(roomId, "players");
    if (players) {
      const playerIndex = players.findIndex((e) => e.userId === userId);
      if (playerIndex > -1) {
        const player = players[playerIndex];
        players.splice(playerIndex, 1);
        await redisService.hSet(roomId, "players", players);
        await removeUserRoom(userId);
        return player;
      }
    }
  } catch (error) {
    console.error("removeUserFromRoom", error);
    throw error;
  }
}

//Start a game
async function setGameStarted(room) {
  try {
    console.log("Going to set game started to true")
    await redisService.hSet(room.roomId, "isGameStarted", true);
  } catch (error) {
    console.error("setGameStarted", error);
    throw error;
  }
}

async function checkPlayerExistence( userId ){
  const pattern = "rt*" ;
  const rooms = await redisService.hGetAllEach(pattern);
  console.log("Rooms length--->" , rooms.length)
  let flag = false , sendData;
  if(rooms.length != 0){
    for(let i=0 ; i< rooms.length ;i++){
      console.log("Room data to be checked--->" , rooms[i])
        if(rooms[i].players.some((player)=> player.userId === userId) && rooms[i].isGameStarted === false){
          flag = true;
          sendData = rooms[i];
          break;
        }else if(rooms[i].players.some((player)=> player.userId === userId) && rooms[i].isGameStarted === true){
          flag = true;
          sendData = rooms[i];
          break;
        }
    }

    console.log("What is the Flag status while checking existency", flag , "Send data --->" , sendData)

    if(flag){
        return {
          status:true,
          data :sendData
        }
    }else{
      return {
        status : true,
        data : sendData
      };
    }
    
  }else{
    return {
      status :false,
      data:{}
    }
  }
}


async function isGameStarted(room) {
  try {
    return redisService.hGet(room.roomId, "isGameStarted");
  } catch (error) {
    console.error("isGameStarted", error);
    throw error;
  }
}

//Delete the room
async function deleteRoom(roomId) {
  try {
    let room = await getRoomData(roomId);

    console.log("in delete room cache", room);
    redisService.del(`g${roomId}`)
    redisService.del(`t${room?.tournamentId}`)
    await Promise.all(
      room.players.map((e) =>{
        redisService.del(`u${e.userId}`)
      })

    );
    await redisService.hDel(roomId);
  } catch (error) {
    console.error("deleteRoom", error);
    throw error;
  }
}

async function incrementUserCount(room) {
  console.log("room in inc", room)
  await redisService.incr(`g${room.roomId}`);
  if (room.tournamentId) {
    await redisService.incr(`t${room.tournamentId}`);
  } else {
    await redisService.incr(`b${room.battleId}`);
  }
}

async function decrementUserCount(room) {
  console.log("room in dec", room)
  await redisService.decr(`g${room.roomId}`);
  if (room.tournamentId) {
    await redisService.decr(`t${room.tournamentId}`);
  } else {
    await redisService.decr(`b${room.battleId}`);
  }
}

async function getUserCountByBattleId(battleId) {
  try {
    const count = await redisService.get(`b${battleId}`);
    return count || 0;
  } catch (error) {
    console.error("getUserCountByBattleId", error);
    throw error;
  }
}

async function getUserCountByTournamentId(tournamentId) {
  try {
    const count = await redisService.get(`t${tournamentId}`);
    return count || 0;
  } catch (error) {
    console.error("getUserCountByTournamentId", error);
    throw error;
  }
}

async function getUserCountByGameId(gameId) {
  try {
    console.log("room in count", room)
    const count = await redisService.get(`g${gameId}`);
    return count || 0;
  } catch (error) {
    console.error("getUserCountByGameId", error);
    throw error;
  }
}


async function updatejoiningTimer(room, data) {
  try {
    console.log("Room in update joining Timer" , room.roomId , "data-->" ,data)
    const masterKey = room.roomId;
    await redisService.hSet(masterKey, "joiningTimer" ,data);    
  } catch (error) {
    console.error("updateRoomData", error);
    throw error;
  }
}

async function updateSubmitTimer(room, data) {
  try {
    console.log("Room in update submit Timer" , room.roomId , "data-->" ,data)
    const masterKey = room.roomId;
    await redisService.hSet(masterKey, "submitTimer" ,data);    
  } catch (error) {
    console.error("updateRoomData", error);
    throw error;
  }
}

module.exports = {
  debugGameData,
  getRoomData,
  getUserRoom,
  addUserRoom,
  setRoomPlayers,
  removeUserRoom,
  updatejoiningTimer,
  updateSubmitTimer,
  checkPlayerExistence,
  getAvailableRoom,
  roomAvailablityforPrivate,
  newRoom,
  removeUserFromRoom,
  setGameStarted,
  isGameStarted,
  deleteRoom,
  getUserCountByBattleId,
  getUserCountByTournamentId,
  getUserCountByGameId,
  incrementUserCount,
  decrementUserCount,
};
