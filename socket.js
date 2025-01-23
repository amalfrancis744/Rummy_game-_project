const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
// let { User } = require('./../admin/api/models/user');
const uuid = require('node-uuid');
const constants = require('./util/constants');
const response = require('./services/response');
const userQuery = require('./model/users/index');
const tableQuery = require('./model/table/index');
const Room = require('./model/room/room');
const config = require('./config/index');
const { callbackErrorResponse } = require('./services/response');
const requestAPI = require('./services/apiIntegration');
const common = require('./services/common');
const timers = {};

var room;

module.exports = {
  configure: async (server) => {
    const NAMESPACE = process.env.WS_BASE_PATH || '';

    const io = new Server(server, { path: '', cors: { origin: '*' } });
    global.io = io.of(NAMESPACE);

    const  User  = require('./model/users/user');

    const { downloadFileSignedUrl } = require('./util/aws-s3-service');

    const gameService = require('./services/game-service');
    const rummyGame = require('./services/rummy-game');
    const rummyRoomCacheService = require('./services/rummy-room-cache-service');
    const rummyGameplayCacheService = require('./services/rummy-gameplay-cache-service');
    const jwtService = require('./util/jwt-service');
    const md5 = require('md5');
    // const sender = require("./sqs/sender");
    const requestTemplate = require('./util/request-template');

    const pubClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    });
    const subClient = pubClient.duplicate();
    await pubClient.connect();
    await subClient.connect();

    io.adapter(
      createAdapter(pubClient, subClient, {
        key: `${process.env.NODE_ENV || 'local'}:socket-adapter`,
      })
    );

    io.of(NAMESPACE).on('connection', async (socket) => {
      console.log('Connection on - ', socket.id);
    

      //Leave Room
      const handlePlayerDisconnect = async (
        hasLeft = false,
        data,
        callback 
      ) => {

        console.log("Data in handle player disconnect--------------->" , data)
        // const isGameStarted = await rummyRoomCacheService.isGameStarted(data);
        // console.log("------isGameStarted--->" , isGameStarted)

        // let room = await rummyGameplayCacheService.getRoomData(data.roomId)
        // console.log("What is the room data --------->" , room)

        let playerExistence = await rummyRoomCacheService.getUserRoom(data.userId);
        console.log("playerExistence ---->" , playerExistence)

        if(playerExistence){

          // if(isGameStarted){


            // io.to(playerExistence.roomId).emit(  'player-removed' , {
            //   userId: data.userId,
            // });


            await rummyGame.leaveGame(data.roomId, data.userId, callback);
          // }

        }else{
          callback({
            message :"Player Doesn't Exists"
          });
        }
        // const player = await rummyRoomCacheService.removeUserFromRoom(
        //   data.roomId,
        //   data.userId
        // );
        // console.log("Player in handle disconnect function----------->" , player)
        // if (player.userId == data.userId) {
        //   // eslint-disable-next-line no-console
        //   console.log('player-removed', data.userId, data.roomId);
        //   rummyGame.emit(data.roomId, 'player-removed', { userId : player.userId });
        //   // delete only if room was not already detached and new room was not assigned
        //   const userCurrentRoom = await rummyRoomCacheService.getUserRoom(
        //     data.userId
        //   );
        //   console.log("User current room-------------->" , userCurrentRoom)
        //   if (
        //     userCurrentRoom &&
        //     data.tournamentId === userCurrentRoom.tournamentId &&
        //     data.gameId === userCurrentRoom.gameId
        //   ) {
        //     await rummyRoomCacheService.removeUserRoom(data.userId);
        //   }
        //   if (isGameStarted) {
        //     // eslint-disable-next-line no-console
        //     console.log(
        //       'isGameStarted true, removing user from gameplay',
        //       data.roomId,
        //       data.userId
        //     );
        //     await rummyGame.leaveGame(data.roomId, data.userId, callback);
        //     // await gameService.invalidateToken(
        //     //   room,
        //     //   socket.handshake.query.token
        //     // );
        //   } else {
        //     // eslint-disable-next-line no-console
        //     console.log(
        //       'isGameStarted false, refunding amount',
        //       data.roomId,
        //       data.userId
        //     );
        //     rummyGame.emit(data.roomId, 'player-left', {
        //       // player: {
        //         userId: player.userId,
        //         userName: player.userName,
        //       // },
        //     });
        //     // refund as game is not started yet
        //     // await gameService.refundGameAmount(
        //     //   room,
        //     //   socket.handshake.query.token
        //     // );
        //     callback({
        //       status: 'Success',
        //     });
        //   }
        // } else {
        //   // eslint-disable-next-line no-console
        //   console.log(
        //     'Player was already removed',
        //     data.roomId,
        //     data.userId,
        //     data.battleId,
        //     data.tournamentId
        //   );
        // }
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log('socket.connected ', socket.connected);
          if (socket.connected) {
            socket.disconnect();
          }
        }, 15000); // keep 15 sec delay to disconnect so that last events get time to emit
      };

      //Matchmaking started on 25th july
      socket.on('matchMaking' , async ( params , callback ) => {

        console.log("Parameters in Matchmaking --->" , params)

        if(!params.userId ||
           !params.noOfPlayers || 
           !params.tournamentId  ||
           !params.token)   
          return callback(
            await response.callbackErrorResponse( 
              0 , 
              false , 
              "Invalid Parameters" 
            )
          );
      
        try{

          // let userExists = await User.findOne({_id : params?.userId});

          let userExists = await requestAPI.verifyUser("/api/v1/verify_user", params.token )

          console.log("userExists",userExists)
          if(!userExists || userExists === undefined) 
            return callback(
              await response.callbackErrorResponse(
                0,
                false,
                "User doesn't Exists"
              )
            );

          if(userExists.user_id.toString() !== params.userId)
            return callback(
              await response.callbackErrorResponse(
                0,
                false,
                "Please share a valid User Id"
              )
            );

            // let updateSocket = await User.updateOne({_id : userExists._id } , {$set : { socketId : socket.id}});

            //  userExists = await User.findOne({_id : params?.userId});


            // let tableExists = await tableQuery.getTable({_id : params?.tournamentId});    //Here we are getting table id inside keyword tournamentId
            
            let tableExists = await requestAPI.fetchTable("/api/v1/get_rummy_config" , {token : params.token , tournamentId : params.tournamentId})
            console.log("Table Exists ---->" , tableExists)


            let userRoom = await rummyRoomCacheService.getUserRoom(params.userId);     //Check if a user is in a room
            console.log("userRoom - ",userRoom);

            if (userRoom) {
              const userRoomPlayer = userRoom.players.find(
                (e) => e.userId === params.userId
              );

              console.log("userRoomPlayer---->" , userRoomPlayer , "User device Id-->" ,userRoomPlayer.xDeviceId , "params.xDeviceId",params.xDeviceId  )
    

              if(userRoomPlayer){
                if (userRoomPlayer.xDeviceId !== params.xDeviceId) {
                  console.log(
                    'user playing with another device',
                    JSON.stringify({ params, userRoomPlayer })
                  );
                  socket.emit(
                    'custom-error',
                    'you are already playing with another device'
                  );
                  socket.disconnect();
                  return;
                }else{
                  console.log("Entered into else",userRoom.isGameStarted);

                  let gameData = await rummyGameplayCacheService.getRoomData(userRoom.roomId);

                  console.log("game data in reconnection", gameData)

                  
                  await userQuery.updateUser(userExists._id , {socketId : socket.id});                  
                  
                  socket.join(userRoom.roomId);
                  
                  const playerToUpdate = userRoom.players.find(player => player.userId === params.userId);
                  
                  if (playerToUpdate) {
                    console.log('Match found. Updating socketId.');
                    playerToUpdate.socketId = socket.id;
                  }
                  
                  if(userRoom.isGameStarted === false){

                      //Transmitting Joined response inside room
                      rummyGame.emit(room.roomId, 'joined', {
                        roomId:room.roomId,
                        players: room.players,
                        me: room.players.find((e) => e.userId === params.userId),
                      });

                  }
                


                  // console.log("After updating socket Id" , userRoom.players)
                  // await rummyGameplayCacheService.updateRoomData(userRoom, {
                  //   players: userRoom.players,
                  // });

                  // if(userRoom.isGameStarted === false){
                  //   rummyGame.emit(userRoom.roomId , "joined",{
                  //     roomId:userRoom.roomId,
                  //     players: userRoom.players,
                  //     me: userRoom.players.find((e) => e.userId === params.userId),
                  //   } )

                  //   console.log("Matchmaking reconnection data--->" , userRoom)
                  // }else{
                    
                  //   let cardsData = await rummyGameplayCacheService.getRoomData(userRoom.roomId);

                  //   console.log("GamePlay data to be checked----->" , cardsData)

                  //   rummyGame.emit(userRoom.roomId , "joined",{
                  //     roomId:userRoom.roomId,
                  //     players: userRoom.players,
                  //     me: userRoom.players.find((e) => e.userId === params.userId),
                  //   });
                  //   const roomData = await rummyGame.getStat(userRoom.roomId);
                  //   console.log("Reconnecting room data --->" , roomData);
                  //     socket.emit('start');
                  //     socket.emit('stat', await rummyGame.getStat(userRoom.roomId));
                  //     rummyGame.emit(userRoom.roomId, "current-player", roomData.currentPlayer);
                  // }              
                }              
              }else{
                return callback(
                  response.callbackErrorResponse(
                    0,
                    false,
                    "No data found"
                  )
                )
              }
            //Check Balance
            }else if(userExists?.user_wallet_balance >= tableExists?.entry_fee){    
              if (userRoom) {
                room = userRoom;
                room.players.find(
                  (e) => e.userId === params.userId
                ).isConnected = true;
                
                rummyRoomCacheService.setRoomPlayers(room.roomId, room.players);
                clearTimeout(timers[params.userId]);
              } else {
                console.log("USER INFO- ",userExists)             
                const player = {
                  socketId : socket.id,
                  id: userExists.user_id.toString(),
                  userId: userExists.user_id.toString(),
                  userName: userExists.name,
                  profileImageUrl: userExists.image_url,
                  xDeviceId: params.xDeviceId ? params.xDeviceId : "",
                  isConnected: true,
                  gameplayTokenMd5: md5(params.token),
                  token : params.token,
                  mainWallet : userExists.user_wallet_balance
                };
  
                const data  = {
                  tournamentId : params.tournamentId,
                  noOfPlayers : tableExists?.no_of_players,
                  userId : params.userId
  
                }

                //Check room availability
                const availableRoom = await rummyRoomCacheService.getAvailableRoom(
                  data
                );
                console.log("player - ",player , "---------------------------availableRoom---------------->",availableRoom);
  
                if (availableRoom) {
                  console.log('Room available');
                  availableRoom.players.push(player);
                  player.userName =
                    player.userName || `Player${availableRoom.players.length}`;
                  room = availableRoom;
                  await rummyRoomCacheService.setRoomPlayers(
                    availableRoom.roomId,
                    availableRoom.players
                  );

                  console.log('user joined room', params.userId, room.roomId);
                      
                  socket.join(room.roomId);
                  
                  //Transmitting Joined response inside room
                  rummyGame.emit(room.roomId, 'joined', {
                    roomId:room.roomId,
                    players: room.players,
                    me: room.players.find((e) => e.userId === params.userId),
                  });

                  let newPlayer = room.players.find((e) => e.userId === params.userId)

                  if(newPlayer) {
                    let joiningBattle = await requestAPI.joinBattle({
                      tournamentId : room.tournamentId,
                      token : newPlayer.token,
                      roomId : room.roomId
                    })
                  }

                } else {
                  room = {
                    roomCode : "",
                    roomId: (params.tournamentId ? 'rt' : 'rb') + uuid.v4(),
                    noOfPlayers: tableExists?.no_of_players,
                    players: [player],
                    isGameStarted: false,
                    tournamentId: params.tournamentId,
                    // gameId: params.gameId ? params.gameId : "",
                    battleId: params.battleId ? params.battleId : "",
                    rummyType: tableExists.rummy_type,
                    gameMode : tableExists.game_mode,
                    rupeePerPoint: tableExists.point_value,
                    joiningTimer : config.joiningTimer,
                    submitTimer : config.submitTimer
                  };
                  if (tableExists.rummy_type === constants.RUMMY_TYPE.POOL) {
                    room.maxPoint = tableExists?.rummy_points;
                  }
                  // player.userName = player.userName || 'Player1';
                  await rummyRoomCacheService.newRoom(room);

                  // eslint-disable-next-line no-console
                  console.log('Room Created successfully', params.userId, room.roomId , "Room--->" , room);
    
                  
                  socket.join(room.roomId);
                  
                  //Transmitting Joined response inside room
                  rummyGame.emit(room.roomId, 'joined', {
                    roomId:room.roomId,
                    players: room.players,
                    me: room.players.find((e) => e.userId === params.userId),
                  });

                  let newPlayer = room.players.find((e) => e.userId === params.userId)
                  
                  if(newPlayer){
                    await requestAPI.joinBattle({
                      tournamentId : room.tournamentId,
                      token : room.players[0].token,
                      roomId : room.roomId
                    })
                  }
                  
                 

                  socket.emit('start');

                  //Start joining Timer
                  await rummyGame.startJoiningTimer(room , io , socket);
                }
                await rummyRoomCacheService.addUserRoom(room, params.userId);
              }
        
              
              
              console.log('Room - ', room);
              await rummyRoomCacheService.incrementUserCount(room);
              
            
            }else{
              // if(typeof callback === 'function'){              
              console.log("Insufficient Balance") 
              return callback(
                 await response.callbackErrorResponse(
                    0,
                    false,
                    "Insufficient Balance"
                  )
                )
            // }
            } 


        }catch(err){
          
          console.log("Error occured while match-making", err);
          
          // socket.disconnect();
        
        }
      });


      //Join Private Room
      socket.on('emitJoinPrivate' , async (params , callback ) =>{

        if(!params.roomCode  || !params.userId ) {
          if(typeof callback === 'function'){
            
            return callback(
              await response.callbackErrorResponse(
                0,
                false,
                "Invalid Parameters"
              )
            )
          }


        }

          console.log("PArameters in emit join Private---->" , params)
          
          try{

            let roomExists = await Room.findOne({room : params.roomCode});

            console.log("Room Exists---------->" , roomExists);
        
            if(!roomExists) {
              if(typeof callback === 'function'){
                return callback(
                  await response.callbackErrorResponse(
                    0,
                    false,
                    "Invalid Room Code"
                  )
                )
              }
            }


            let userExists = await userQuery.getUser({_id : params.userId});

            if(!userExists) {
              if(typeof callback === 'function'){
                return callback(
                  await response.callbackErrorResponse(
                    0,
                    false,
                    "Invalid User"
                  )
                )
              }
            }

            let tableExists = await tableQuery.getTable({_id:roomExists.tournamentId});

            console.log("Table Exists------------->" , tableExists)

            if(roomExists.players.length == 0){
            
              userExists = await userQuery.updateUser(userExists._id , { socketId : socket.id});

              console.log("User ------>", userExists)
              
              
              let localPlayer = {
                id : userExists._id,

              }
              
              let insertingPlayer = await Room.updateOne(
                {
                  _id : roomExists._id
                } ,
                {
                  $push : { players : localPlayer }
                },{
                  returnOriginal:false
                })
                

                let playerData = {
                  socketId : userExists.socketId,
                  id: userExists._id,
                  userId: userExists._id,
                  userName: userExists.name,
                  profileImageUrl: userExists.profilepic,
                  xDeviceId: params.xDeviceId ? params.xDeviceId : "",
                  isConnected: true,
                  gameplayTokenMd5: md5(userExists.tokens[0].token),
                  mainWallet : userExists.main_wallet
                };   
              
              let cacheData = {

                roomCode : roomExists.room,
                roomId: (tableExists._id !== undefined ? 'rt' : 'rb') + uuid.v4(),
                noOfPlayers: roomExists?.no_of_players,
                players: [playerData],
                isGameStarted: false,
                tournamentId: tableExists._id,
                rummyType: roomExists.room_type,
                gameMode : tableExists.game_mode,
                rupeePerPoint: tableExists.point_value,
                joiningTimer : config.joiningTimer,
                submitTimer : config.submitTimer
              }

              await rummyRoomCacheService.newRoom(cacheData);

              console.log('First Player has joined the Private room successfully', params.userId, cacheData.roomId , "Room--->" , cacheData);
      
                  
              socket.join(cacheData.roomId);
              
              
              //Transmitting Joined Private room response
              rummyGame.emit(cacheData.roomId, 'joined', {
                roomId:cacheData.roomId,
                players: cacheData.players,
                me: cacheData.players.find((e) => e.userId === params.userId),
              });


              await rummyGame.startJoiningTimer(cacheData , io , socket);

              await rummyRoomCacheService.addUserRoom(cacheData, params.userId);

              if(typeof callback === 'function'){
                return callback(
                  await response.callbackSuccessResponse(
                    1,
                    true,
                    "Successfully joined"
                  )
                )
              }
              
          
            }else if(roomExists.players.length < roomExists.no_of_players && roomExists.players.length !== 0){

                userExists = await userQuery.updateUser(userExists._id , { socketId : socket.id});

                let playerData = {
                  socketId : userExists.socketId,
                  id: userExists._id,
                  userId: userExists._id,
                  userName: userExists.name,
                  profileImageUrl: userExists.profilepic,
                  xDeviceId: params.xDeviceId ? params.xDeviceId : "",
                  isConnected: true,
                  gameplayTokenMd5: md5(userExists.tokens[0].token),
                  mainWallet : userExists.main_wallet
                };   
                
                // let localPlayer = {
                //   id : userExists._id,
  
                // }
                
                await Room.updateOne(
                  {
                    _id : roomExists._id
                  } ,
                  {
                    $push : { players : {
                      id : userExists._id,
      
                    } }
                  })

                const data  = {
                  tournamentId : roomExists.tournamentId,
                  roomCode : roomExists.room,
                  noOfPlayers : tableExists?.no_of_players,
                  userId : params.userId
  
                }

                //Check room availability
                const availableRoom = await rummyRoomCacheService.roomAvailablityforPrivate(
                  data
                );

                console.log("What is the Available Room data---------------->" , availableRoom)

                if(availableRoom || availableRoom !== undefined){

                  // if(availableRoom.players.some((player) => player.userId === params.userId)){
                  //   return callback(
                  //     await response.callbackErrorResponse(
                  //       0,
                  //       false,
                  //       "You are already in a room"
                  //     )
                  //   )
                  // }else{
                    
                    console.log('Room available');
                    availableRoom.players.push(playerData);
                    playerData.userName =
                    playerData.userName || `Player${availableRoom.players.length}`;
                    await rummyRoomCacheService.setRoomPlayers(
                      availableRoom.roomId,
                      availableRoom.players
                    );
  
                    console.log('user joined room', params.userId, availableRoom.roomId);
                        
                    socket.join(availableRoom.roomId);
                    
                    //Transmitting Joined response inside room
                    rummyGame.emit(availableRoom.roomId, 'joined', {
                      roomId:availableRoom.roomId,
                      players: availableRoom.players,
                      me: availableRoom.players.find((e) => e.userId === params.userId),
                    });

                    

                   await rummyRoomCacheService.addUserRoom(availableRoom, params.userId);


                    if(availableRoom.players.length === tableExists.no_of_players){
                        console.log("Send the Stat Data and start timer");
                        if(typeof callback === 'function'){
                          return callback(
                            await response.callbackSuccessResponse(
                              1,
                              true,
                              "All players are joined"
                            )
                          )
                        }
                    }else{
                      if(typeof callback === 'function'){
                        return callback(
                          await response.callbackSuccessResponse(
                            1,
                            true,
                            "Successfully joined"
                          )
                        )
                      }
                    }
                  // }

                }else{
                  if(typeof callback === 'function'){
                    return callback(
                      await response.callbackErrorResponse(
                        0,
                        false,
                        "You are already in another room"
                      )
                    )
                  }
                }



            }else{
              if(typeof callback === 'function'){
                return callback(
                  await response.callbackErrorResponse(
                    0,
                    false,
                    "Room is already full"
                  )
                )
              }
            }
            


          }catch(err){
            console.log("Error occured while joining private room" , err);
          }
      });

     
      socket.on('disconnect', async () => {
        // eslint-disable-next-line no-console
        console.log('disconnected user from ', socket.id);

        // const _room = await rummyRoomCacheService.getRoomData(params.roomId);
        // if (!_room) {
        //   return;
        // }
        // await rummyRoomCacheService.decrementUserCount(_room);

        // const playerIndex = _room.players.findIndex(
        //   (e) => e.userId === payload.userId
        // );
        // if (-1 !== playerIndex) {
        //   _room.players[playerIndex].isConnected = false;
        //   rummyRoomCacheService.setRoomPlayers(_room.roomId, _room.players);
        //   // eslint-disable-next-line no-console
        //   console.log('disconnected', payload.userId, _room.roomId);
        //   rummyGame.emit(_room.roomId, 'player-disconnected', {
        //     player: _room.players[playerIndex],
        //   });
        //   console.log("Current Player is ",_room);
        //   // timers[payload.userId] = setTimeout(() => {
        //   //   handlePlayerDisconnect();
        //   // }, 60000);
        // }
      });

      socket.on('checkRunningGame' , async (params, callback) => {

        if(!params.userId){
          if(typeof callback === 'function'){
            
            return callback(
              await response.callbackErrorResponse(
                0,
                false,
                "Invalid Parameters"
              )
            )
          
          }
        }

        console.log("Parameters in check running game---->" , params)

        try{

          let userExists = await rummyRoomCacheService.checkPlayerExistence(params.userId)

          console.log("ROOM EIXTS-------->" , JSON.stringify(userExists))
          if( userExists.status === true){
            if(typeof callback === "function"){
              return callback(
                await response.callbackSuccessResponse(
                  1,
                  true,
                  "Room Exists",

                )
              )
            }
          }else{
            console.log("Entered into else")
            if(typeof callback === 'function'){
              return callback(
                await response.callbackErrorResponse(
                  0,
                  false,
                  "Player doesn't Exists in any room"
                )
              )
            }
          }


        }catch(err){
          console.log("Check Running Game Event error",err);
        }


      });

      //DROP Event
      socket.on('drop', async (params, callback) => {

        console.log("Parameters in drop event-->" , params)

        if(!params.roomId || ! params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          )
        try {
        
          callback = rummyGame.sanitizeCallback(callback);
        
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
        
          if (!_room) {
             return callback(
              await response.callbackErrorResponse(
                0,
                false,
                'game not started'
              ));
          }
          await rummyGame.dropCurrentPlayer(_room, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('drop', error);
        }
      });

      //Auto-drop Event
      socket.on('auto-drop', async (params, callback) => {


        console.log("Parameters in auto-drop event-->" , params)

        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          )

        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.autoDropPlayer(_room, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('auto-drop', error);
        }
      });

      //Pick Card Event
      socket.on('pick', async (params, callback) => {
        console.log("PArameters in pick-->" , params);


        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );

        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          // console.log("Room in pick--->" , _room)
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.pickCard(_room, params, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('pick', error);
        }
      });

      //Discard Card Event
      socket.on('discard', async (params, callback) => {

        console.log("Parameters in Discard event-->" , params)

        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );

        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.discardCard(_room, params, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('discard', error);
        }
      });

      //Show card Event
      socket.on('show', async (params, callback) => {
        console.log("PArameters in show event-->" , params);


        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );

        try {
        
          callback = rummyGame.sanitizeCallback(callback);
        
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
        
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
        
          await rummyGame.show(_room, params, params.userId, callback);
        
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('show', error);
        }
      });

      //Submit Sets Event
      socket.on('submit', async (params, callback) => {
        console.log("PArameters in submit event-->" , params ,"groups", params?.groups);


        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );
        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.submit(_room, params, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('submit', error);
        }
      });

      //Card Validate Event
      socket.on('validate', async (params, callback) => {
        // console.log("PArameters in validate event-->" , params);


        if(!params.roomId )
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );
        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.validate(_room, params, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('validate', error);
        }
      });

      socket.on('prize-split', async (params, callback) => {
        console.log("PArameters in prize-split event-->" , params);


        if(!params.roomId || !params.userId)
          return callback(
            await response.callbackErrorResponse(
              0,
              false,
              "Invalid Parameters"
            )
          );
        try {
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(
            params.roomId
          );
          if (!_room) {
            callback({
              status: 'Fail',
              message: 'game not started',
            });
            return;
          }
          await rummyGame.splitPrize(_room, params.userId, callback);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('prize-split', error);
        }
      });

      //Leave gane Event
      socket.on('leave-game', async (params, callback) => {

        
        console.log("-----------------Parameter in leave-game---------------------------->> " ,params );

        if(!params.roomId || !params.userId ) {
          return callback(
            await response.callbackErrorResponse( 
              0 , 
              false , 
              "Invalid Parameters" 
            )
          );
        }
        await handlePlayerDisconnect(true, params , callback);
      });

      socket.on('stat', async (params, callback) => {
        try{
          console.log("Parameters in stat event----------------->" , params)
          callback = rummyGame.sanitizeCallback(callback);
          const _room = await rummyGameplayCacheService.getRoomData(params.roomId);
          const stat = await rummyGame.getStat(params.roomId, _room);
          console.log("Callback response in stat event---->",stat)
          callback({
            status: 'Success',
            data: { ...stat, gameStatus: stat ? 'started' : 'waiting' },
          });

        }catch(err){
          console.log("Error occured while triggering Stat",err)
        }
      });

      socket.on('config', async (data, callback) => {
        callback = rummyGame.sanitizeCallback(callback);
        callback({
          status: 'Success',
          data: rummyGame.getConfig(),
        });
      });

      socket.on('ping', async (data, callback) => {
        callback = rummyGame.sanitizeCallback(callback);
        callback({
          status: 'Success',
          data: {},
        });
        socket.emit('pong');
      });

      socket.on('chat-send', (data) => {
        rummyGame.emit(room.roomId,'chat-recieve',data);
      });


    });
  },
};
