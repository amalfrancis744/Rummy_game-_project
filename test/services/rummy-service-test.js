/* eslint-disable no-undef */
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const { Server } = require('socket.io');
const rummyGame = require('../../services/rummy-game');
const rummyGamePlayCacheService = require('../../services/rummy-gameplay-cache-service');
const sender = require('../../sqs/sender');
const requestTemplate = require('../../util/request-template');

function run() {
    const callback = () => {};
    global.io = new Server({}, { path: '', cors: { origin: '*' } });
    let gameMap = {
        players2: [
            {
                userId: 'userId1',
                userName: 'Bhavesh',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId2',
                userName: 'Sagar',
                life: 3,
                disqualified: false
            }
        ],
        players6:[
            {
                userId: 'userId1',
                userName: 'Bhavesh',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId2',
                userName: 'Sagar',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId3',
                userName: 'Krunal',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId4',
                userName: 'Tejas',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId5',
                userName: 'Jay',
                life: 3,
                disqualified: false
            },
            {
                userId: 'userId6',
                userName: 'Robot',
                life: 3,
                disqualified: false
            }
        ]
    };


    describe('Init game test', () => {
        let startRummyGame;

        beforeEach(function () {
            startRummyGame = sinon.stub(rummyGamePlayCacheService, 'startGame');
        });

        afterEach(function() {
            startRummyGame.restore();
        });



        it('it should throw minimum players exception', () => {
            let roomCache = {
                roomId: 'id',
                tournamentId: 'id',
                gameId: 'id',
                players: [
                    {
                        userId: 'id1',
                        userName: 'user1'
                    }
                ]
            };
            try {
                rummyGame.initGame(roomCache);
            } catch (error) {
                expect(error.status).to.eq(400);
                expect(error.code).to.eq(102);
                expect(error.message).to.eq('Bad request');
                expect(error.errorDescription).to.eq('Min 2 players required');
            }

        });

        it('it should start the game rummy point', async() => {
            startRummyGame.returns({});
            let roomCache = {
                roomId: 'id',
                tournamentId: 'id',
                gameId: 'id',
                players: [
                    {
                        userId: 'id1',
                        userName: 'user1'
                    },
                    {
                        userId: 'id2',
                        userName: 'user2'
                    }
                ]
            };
            const result = await rummyGame.initGame(roomCache);
            expect(result).to.not.eql(null);
        });

        it('it should start the game rummy pool', async() => {
            startRummyGame.returns({});
            let roomCache = {
                roomId: 'id',
                battleId: 'id',
                gameId: 'id',
                rummyType: 'pool',
                maxPoint: '101',
                players: gameMap.players6
            };
            const copiedRoom = JSON.parse(JSON.stringify(roomCache));
            const result = await rummyGame.initGame(copiedRoom);
            expect(result).to.not.eql(null);
        });
    });

    describe('Start Countdown Test', () => {

        let rummyGameplayCacheServiceGetRoomData, rummyGameplayCacheServiceUpdateCurrentPlayer, senderEmit, 
            rummyGameplayCacheServiceUpdateTimerValue;
        const room = {
            roomId: 'roomId',
            battleId: 'battleId',
            gameId: 'gameId',
            winner: [],
            eliminatedPlayers: [],
            players: gameMap.players2,
            currentPlayer: gameMap.players2[0],
            winners:[]
        };

        beforeEach(function(){
            rummyGameplayCacheServiceGetRoomData = sinon.stub(rummyGamePlayCacheService, 'getRoomData');
            rummyGameplayCacheServiceUpdateCurrentPlayer = sinon.stub(rummyGamePlayCacheService, 'updateCurrentPlayer');
            senderEmit = sinon.stub(sender, 'emit');
            rummyGameplayCacheServiceUpdateTimerValue = sinon.stub(rummyGamePlayCacheService, 'updateTimerValue');
        });

        afterEach(function(){
            rummyGameplayCacheServiceGetRoomData.restore();
            rummyGameplayCacheServiceUpdateCurrentPlayer.restore();
            rummyGameplayCacheServiceUpdateTimerValue.restore();
            senderEmit.restore();
        });

        it('it should start countDown', function(done) {
            this.timeout(6000); // A very long environment setup.
            setTimeout(done, 5500);
            const copiedRoom = JSON.parse(JSON.stringify(room));
            rummyGameplayCacheServiceGetRoomData.returns({
                players: copiedRoom.players,
                then: (value) => {
                    value(copiedRoom);
                }
            });
            rummyGameplayCacheServiceUpdateCurrentPlayer.returns();
            senderEmit.returns();
            rummyGameplayCacheServiceUpdateTimerValue.returns();
            rummyGame.startCountdown(copiedRoom);
        });

        it('it should start countDown -isGameFinished true', function(done) {
            this.timeout(6000); // A very long environment setup.
            setTimeout(done, 5500);
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.endTime = true;
            rummyGameplayCacheServiceGetRoomData.returns({
                players: copiedRoom.players,
                then: (value) => {
                    value(copiedRoom);
                }
            });
            rummyGameplayCacheServiceUpdateCurrentPlayer.returns();
            senderEmit.returns();
            rummyGameplayCacheServiceUpdateTimerValue.returns();
            rummyGame.startCountdown(copiedRoom);
        });

        it('it should start countDown -isGameFinished false', function(done) {
            this.timeout(6000); // A very long environment setup.
            setTimeout(done, 5500);
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.endTime = false;
            copiedRoom.currentPlayer.userId = 'xyz';
            rummyGameplayCacheServiceGetRoomData.returns({
                players: copiedRoom.players,
                then: (value) => {
                    value(copiedRoom);
                }
            });
            rummyGameplayCacheServiceUpdateCurrentPlayer.returns();
            senderEmit.returns();
            rummyGameplayCacheServiceUpdateTimerValue.returns();
            rummyGame.startCountdown(copiedRoom);
        });

    });

    describe('Get State Test', () => {
        let rummyGameCacheServiceGetRoomData;
        let room = {
            roomId: 'roomId',
            battleId: 'battleId',
            gameId: 'gameId',
            openDeck: [],
            players: [
                {
                    userId: 'id1',
                    userName: 'user1',
                    disqualified: false,
                    life: 3
                },
                {
                    userId: 'id2',
                    userName: 'user2',
                    disqualified: false,
                    life: 3
                }
            ]
        };

        beforeEach(function () {
            rummyGameCacheServiceGetRoomData = sinon.stub(rummyGamePlayCacheService, 'getRoomData');
        });

        afterEach(function() {
            rummyGameCacheServiceGetRoomData.restore();
        });

        it('it should get room data if room is null', async() => {
            room.currentPlayer = room.players[0];
            rummyGameCacheServiceGetRoomData.returns(room);
            const result = await rummyGame.getStat('roomId', null);
            expect(result).to.not.eql(null);
        });

        it('it should return room with game status', async() => {
            room.currentPlayer = room.players[0];
            room.canSplitPrize = true;
            const result = await rummyGame.getStat('roomId', room);
            expect(result.gameStatus).to.eql('started');
        });
        
        it('it should return null', async() => {
            rummyGameCacheServiceGetRoomData.returns(null);
            const result = await rummyGame.getStat('roomId', null);
            expect(result).to.eql(null);
        });
        

    });

    describe('Get config Test', () => {
        it('it should return configs of game', () => {
            const result =  rummyGame.getConfig();
            expect(result.FIRST_DROP_POINTS_101).to.eql(20);
        });
        
    });
    
    describe('Auto Drop toggle test', () => {
        let rummyGameplayCacheServiceUpdateAutoDropKey, rummyGameplayCacheServiceUpdateHasDroppedKey;
        let room = {
            roomId: 'roomId',
            battleId: 'battleId',
            gameId: 'gameId',
            openDeck: [],
            players: gameMap.players2
        };

        beforeEach(function(){
            rummyGameplayCacheServiceUpdateAutoDropKey = sinon.stub(rummyGamePlayCacheService, 'updateAutoDropKey');
            rummyGameplayCacheServiceUpdateHasDroppedKey = sinon.stub(rummyGamePlayCacheService, 'updateHasDroppedKey');
        });

        afterEach(function(){
            rummyGameplayCacheServiceUpdateAutoDropKey.restore();
            rummyGameplayCacheServiceUpdateHasDroppedKey.restore();
        });

        it('it should mark player auto drop true', async() => {
            rummyGameplayCacheServiceUpdateAutoDropKey.returns();
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom[rummyGame.getAutoDropKey('userId1')] = false;
            const result = await rummyGame.autoDropPlayer(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should mark player auto drop false', async() => {
            rummyGameplayCacheServiceUpdateAutoDropKey.returns();
            rummyGameplayCacheServiceUpdateHasDroppedKey.returns();
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom[rummyGame.getAutoDropKey('userId1')] = true;
            const result = await rummyGame.autoDropPlayer(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
    });

    describe('Pick card test', () => {
        let rummyGameplayCacheServiceUpdateRoomData;
        let room = {
            roomId: 'roomId',
            players: gameMap.players2,
            openDeck: ['s3', 's4', 's5', 's6'],
            closedDeck: ['s3', 's4'],
            currentPlayer: gameMap.players2[0]
        };
        let data = {
            deck: 'open'
        };
        beforeEach(function(){
            rummyGameplayCacheServiceUpdateRoomData = sinon.stub(rummyGamePlayCacheService, 'updateRoomData');
        });

        afterEach(function(){
            rummyGameplayCacheServiceUpdateRoomData.restore();
        });

        it('it should return if current user is not equal to given userId', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            const result = rummyGame.pickCard(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should return if deck is null', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedData.deck = null;
            const result = rummyGame.pickCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should pick card from open deck and add it to users cards array', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedData.deck = 'open';
            copiedRoom.currentPlayer.cards = ['s7', 's8', 'sK'];
            copiedRoom.players[0].cards = ['s7', 's8', 'sK'];
            copiedRoom.players[0].noOfTurnsTaken = 0;
            rummyGameplayCacheServiceUpdateRoomData.returns();
            const result = await rummyGame.pickCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should pick card from close deck and add it to users cards array', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedData.deck = 'close';
            copiedRoom.currentPlayer.cards = ['s7', 's8', 'sK'];
            copiedRoom.players[0].cards = ['s7', 's8', 'sK'];
            copiedRoom.players[0].noOfTurnsTaken = 0;
            rummyGameplayCacheServiceUpdateRoomData.returns();
            const result = await rummyGame.pickCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
    });
    
    describe('Discard card test', () => {
        let rummyGameplayCacheServiceUpdateRoomData, rummyGameplayCacheServiceUpdateCurrentPlayer, rummyGameplayCacheServiceUpdateTimerValue;
        let room = {
            roomId: 'roomId',
            players: gameMap.players2,
            openDeck: ['s3', 's4', 's5', 's6'],
            closedDeck: ['s3', 's4'],
            currentPlayer: gameMap.players2[0]
        };

        let data = {
            card: 'sA'
        };

        beforeEach(function(){
            rummyGameplayCacheServiceUpdateRoomData = sinon.stub(rummyGamePlayCacheService, 'updateRoomData');
            rummyGameplayCacheServiceUpdateCurrentPlayer = sinon.stub(rummyGamePlayCacheService, 'updateCurrentPlayer');
            rummyGameplayCacheServiceUpdateTimerValue = sinon.stub(rummyGamePlayCacheService, 'updateTimerValue');
        });

        afterEach(function(){
            rummyGameplayCacheServiceUpdateRoomData.restore();
            rummyGameplayCacheServiceUpdateCurrentPlayer.restore();
            rummyGameplayCacheServiceUpdateTimerValue.restore();
        });

        it('it should return if current user is not equal to given userId', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            const result = rummyGame.discardCard(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should return if card is null', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedData.card = null;
            const result = rummyGame.discardCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should return if user did not pick up the card', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasPicked = false;
            const result = rummyGame.discardCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
        it('it should return if card not found in user cards array', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasPicked = true;
            copiedData.card = 'sA';
            copiedRoom.currentPlayer.cards = ['s7', 's8', 'sK'];
            copiedRoom.players[0].cards = ['s7', 's8', 'sK'];
            const result = rummyGame.discardCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should discard card from players card array and add it to open deck', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedData.card = 'sA';
            copiedRoom.currentPlayer.cards = ['sA', 's8', 'sK'];
            copiedRoom.players[0].cards = ['sA', 's8', 'sK'];
            copiedRoom.hasPicked = true;
            rummyGameplayCacheServiceUpdateRoomData.returns();
            rummyGameplayCacheServiceUpdateCurrentPlayer.returns();
            rummyGameplayCacheServiceUpdateTimerValue.returns();
            const result = await rummyGame.discardCard(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
    });
    
    describe('Place Show Test', () => {
        let rummyGameplayCacheServiceUpdateRoomData, rummyGameplayCacheServiceUpdateTimerValue;
        let room = {
            roomId: 'roomId',
            players: gameMap.players2,
            openDeck: ['s3', 's4', 's5', 's6'],
            closedDeck: ['s3', 's4'],
            currentPlayer: gameMap.players2[0]
        };

        let data = {
            card: 'sA'
        };

        beforeEach(function(){
            rummyGameplayCacheServiceUpdateRoomData = sinon.stub(rummyGamePlayCacheService, 'updateRoomData');
            rummyGameplayCacheServiceUpdateTimerValue = sinon.stub(rummyGamePlayCacheService, 'updateTimerValue');
        });

        afterEach(function(){
            rummyGameplayCacheServiceUpdateRoomData.restore();
            rummyGameplayCacheServiceUpdateTimerValue.restore();
        });

        it('it should return if current user is not equal to given userId', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            const result = rummyGame.show(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should mark hasShow true', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            const result = await rummyGame.show(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
    });
    
    describe('Submit Test', () => {
        let rummyGameplayCacheServiceUpdateHasSubmittedKey, rummyGameplayCacheServiceUpdateRoomData, rummyGameplayCacheServiceHIncrBy,
            rummyGameplayCacheServiceUpdateIsEliminatedKey, rummyGameplayCacheServiceHDecrBy, rummyGameplayCacheServiceUpdateHasDroppedKey,
            rummyGameplayCacheServiceGetRoomData, rummyGameplayCacheServiceUpdateTimerValue, rummyGameplayCacheServiceUpdateCurrentPlayer,
            rummyGameCacheServiceDeleteRoomData, senderEmit, rummyGameplayCacheServiceUpdateAutoDropKey, requestTemplateGet;
        
        let room = {
            roomId: 'roomId',
            openDeck: ['s3', 's4', 's5', 's6'],
            closedDeck: ['s3', 's4'],
            jokerCards: ['sA','cA'],
            tournamentId: 'id',
            players: gameMap.players6,
            currentPlayer: gameMap.players6[0]
        };

        let data = {
            groups: [
                {
                    cards:['sA','s2','s3']
                }
            ]
        };

        beforeEach(function(){
            rummyGameplayCacheServiceUpdateHasSubmittedKey = sinon.stub(rummyGamePlayCacheService, 'updateHasSubmittedKey');
            rummyGameplayCacheServiceUpdateIsEliminatedKey = sinon.stub(rummyGamePlayCacheService, 'updateIsEliminatedKey');
            rummyGameplayCacheServiceUpdateRoomData = sinon.stub(rummyGamePlayCacheService, 'updateRoomData');
            rummyGameplayCacheServiceHIncrBy = sinon.stub(rummyGamePlayCacheService, 'hIncrBy');
            rummyGameplayCacheServiceHDecrBy = sinon.stub(rummyGamePlayCacheService, 'hDecrBy');
            rummyGameplayCacheServiceUpdateHasDroppedKey = sinon.stub(rummyGamePlayCacheService, 'updateHasDroppedKey');
            rummyGameplayCacheServiceGetRoomData = sinon.stub(rummyGamePlayCacheService, 'getRoomData');
            rummyGameplayCacheServiceUpdateTimerValue = sinon.stub(rummyGamePlayCacheService, 'updateTimerValue');
            rummyGameplayCacheServiceUpdateCurrentPlayer = sinon.stub(rummyGamePlayCacheService, 'updateCurrentPlayer');
            rummyGameCacheServiceDeleteRoomData = sinon.stub(rummyGamePlayCacheService, 'deleteRoom');
            senderEmit = sinon.stub(sender, 'emit');
            rummyGameplayCacheServiceUpdateAutoDropKey = sinon.stub(rummyGamePlayCacheService, 'updateAutoDropKey');
            requestTemplateGet = sinon.stub(requestTemplate, 'Get');
        });
        
        afterEach(function(){
            rummyGameplayCacheServiceHIncrBy.restore();
            rummyGameplayCacheServiceUpdateHasSubmittedKey.restore();
            rummyGameplayCacheServiceUpdateIsEliminatedKey.restore();
            rummyGameplayCacheServiceUpdateRoomData.restore();
            rummyGameplayCacheServiceHDecrBy.restore();
            rummyGameplayCacheServiceUpdateHasDroppedKey.restore();
            rummyGameplayCacheServiceGetRoomData.restore();
            rummyGameplayCacheServiceUpdateTimerValue.restore();
            rummyGameplayCacheServiceUpdateCurrentPlayer.restore();
            rummyGameCacheServiceDeleteRoomData.restore();
            senderEmit.restore();
            rummyGameplayCacheServiceUpdateAutoDropKey.restore();
            requestTemplateGet.restore();
        });

        it('it should return if hasShown is false', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = false;
            const result = rummyGame.submit(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should return current player placed wrong show and drop that player', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['s2','s4','s5'];
            copiedRoom[rummyGame.getScoreKey('userId1')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            copiedRoom['remaining-players'] = 5;
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should placed right show of current player ', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s2','s3'];
            copiedRoom[rummyGame.getScoreKey('userId1')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            rummyGameplayCacheServiceHIncrBy.returns(0);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'point';
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
        it('it should placed right show of other player rummy pool 101', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            rummyGameplayCacheServiceHIncrBy.returns(40);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '101';
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should placed right show of other player rummy pool 101 eliminate player', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            rummyGameplayCacheServiceHIncrBy.returns(150);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '101';
            copiedRoom.eliminatedPlayers = [];
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should placed right show of other player rummy pool 201', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            rummyGameplayCacheServiceHIncrBy.returns(40);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '201';
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should placed right show of other player rummy pool 201 eliminate player', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(5);
            rummyGameplayCacheServiceHIncrBy.returns(250);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '201';
            copiedRoom.eliminatedPlayers = [];
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should emit submit event point tournament', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(0);
            rummyGameplayCacheServiceHIncrBy.returns(50);
            copiedRoom['remaining-players'] = 5;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'point';
            copiedRoom.winner =['userId1'];
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });

        it('it should emit submit event pool rummy and start next round', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(0);
            rummyGameplayCacheServiceHIncrBy.returns(50);
            copiedRoom['remaining-players'] = 2;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '201';
            copiedRoom[rummyGame.getIsEliminatedKey('userId2')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId1')] = false;
            copiedRoom.eliminatedPlayers = [];
            copiedRoom.winner = ['userId1'];
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });
        
        it('it should emit submit event pool rummy and finish game', async() => {
            room.players = gameMap.players2;
            const copiedRoom = JSON.parse(JSON.stringify(room));
            const copiedData = JSON.parse(JSON.stringify(data));
            copiedRoom.hasShown = true;
            copiedData.groups[0].cards = ['sA','s4','s3'];
            copiedRoom[rummyGame.getScoreKey('userId2')] = 0;
            rummyGameplayCacheServiceHDecrBy.returns(0);
            rummyGameplayCacheServiceHIncrBy.returns(250);
            copiedRoom['remaining-players'] = 2;
            copiedRoom['submit-count-players'] = 0;
            copiedRoom.rummyType = 'pool';
            copiedRoom.maxPoint = '201';
            copiedRoom[rummyGame.getIsEliminatedKey('userId2')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId1')] = false;
            copiedRoom.eliminatedPlayers = [];
            copiedRoom.winner = ['userId1'];
            rummyGameplayCacheServiceGetRoomData.returns(copiedRoom);
            const result = await rummyGame.submit(copiedRoom, copiedData, 'userId2', callback);
            expect(result).to.not.eql(null);
        });
        
        
    });
    
    describe('Validate Test', () => {
        const data = {
            groups: [
                {
                    cards:['sA', 's2', 's3']
                }
            ]
        };

        const room = {
            jokerCards: ['sA', 'cA']
        };

        it('it should validate set of cards', () => {
            const result = rummyGame.validate(room,data,callback);
            expect(result).to.not.eql(null);    
        });
        
    });
    
    describe('Split Prize Test', () => {
        let rummyGameplayCacheServiceUpdateRoomData, rummyGameplayCacheServiceHIncrBy, rummyGameplayCacheServiceHDecrBy,
            rummyGameplayCacheServiceGetRoomData, rummyGameCacheServiceDeleteRoomData, senderEmit, 
            rummyGameplayCacheServiceUpdateSplitPrizeKey, requestTemplateGet;

        let room = {
            roomId: 'roomId',
            openDeck: ['s3', 's4', 's5', 's6'],
            closedDeck: ['s3', 's4'],
            jokerCards: ['sA','cA'],
            battleId: 'id',
            players: gameMap.players6,
            currentPlayer: gameMap.players6[0]
        };

        beforeEach(function(){
            rummyGameplayCacheServiceUpdateRoomData = sinon.stub(rummyGamePlayCacheService, 'updateRoomData');
            rummyGameplayCacheServiceHIncrBy = sinon.stub(rummyGamePlayCacheService, 'hIncrBy');
            rummyGameplayCacheServiceHDecrBy = sinon.stub(rummyGamePlayCacheService, 'hDecrBy');
            rummyGameplayCacheServiceGetRoomData = sinon.stub(rummyGamePlayCacheService, 'getRoomData');
            rummyGameplayCacheServiceUpdateCurrentPlayer = sinon.stub(rummyGamePlayCacheService, 'updateCurrentPlayer');
            rummyGameCacheServiceDeleteRoomData = sinon.stub(rummyGamePlayCacheService, 'deleteRoom');
            senderEmit = sinon.stub(sender, 'emit');
            rummyGameplayCacheServiceUpdateSplitPrizeKey = sinon.stub(rummyGamePlayCacheService, 'updateSplitPrizeKey');
            requestTemplateGet = sinon.stub(requestTemplate, 'get');
        });
        
        afterEach(function(){
            rummyGameplayCacheServiceHIncrBy.restore();
            rummyGameplayCacheServiceUpdateRoomData.restore();
            rummyGameplayCacheServiceHDecrBy.restore();
            rummyGameplayCacheServiceGetRoomData.restore();
            rummyGameplayCacheServiceUpdateCurrentPlayer.restore();
            rummyGameCacheServiceDeleteRoomData.restore();
            senderEmit.restore();
            rummyGameplayCacheServiceUpdateSplitPrizeKey.restore();
            requestTemplateGet.restore();
        });

        it('it should return if prize split set to false', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.canSplitPrize = false;
            const result = rummyGame.splitPrize(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should return if eliminated players are less than 3', () => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.canSplitPrize = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId5')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId6')] = true;
            const result = rummyGame.splitPrize(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should increase split prize counter', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.canSplitPrize = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId1')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId2')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId3')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId4')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId5')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId6')] = true;
            copiedRoom[rummyGame.getSplitPrizeKey('userId1')] = false;
            copiedRoom['split-prize-counter'] = 0;
            rummyGameplayCacheServiceHIncrBy.returns(1);
            const result = await rummyGame.splitPrize(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });


        it('it should increase split prize counter and spilt prize -1', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.canSplitPrize = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId1')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId2')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId3')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId4')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId5')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId6')] = true;
            copiedRoom[rummyGame.getSplitPrizeKey('userId1')] = false;
            copiedRoom[rummyGame.getSplitPrizeKey('userId2')] = false;
            copiedRoom[rummyGame.getSplitPrizeKey('userId3')] = false;
            copiedRoom[rummyGame.getDropCountKey('userId1')] = 1;
            copiedRoom[rummyGame.getDropCountKey('userId2')] = 2;
            copiedRoom[rummyGame.getDropCountKey('userId3')] = 3;
            copiedRoom['split-prize-counter'] = 0;
            rummyGameplayCacheServiceHIncrBy.returns(3);
            requestTemplateGet.returns({
                data:{
                    result:{
                        entryFees: 10,
                        adminComisionPerUser: 5,
                        totalPlayersToAllow: 6
                    }
                }
            });
            copiedRoom.winner = [];
            copiedRoom.rummyType = 'pool';
            copiedRoom.eliminatedPlayers = ['userId4','userId5','userId6'];
            const result = await rummyGame.splitPrize(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });

        it('it should increase split prize counter and spilt prize -2', async() => {
            const copiedRoom = JSON.parse(JSON.stringify(room));
            copiedRoom.canSplitPrize = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId1')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId2')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId3')] = false;
            copiedRoom[rummyGame.getIsEliminatedKey('userId4')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId5')] = true;
            copiedRoom[rummyGame.getIsEliminatedKey('userId6')] = true;
            copiedRoom[rummyGame.getSplitPrizeKey('userId1')] = false;
            copiedRoom[rummyGame.getSplitPrizeKey('userId2')] = false;
            copiedRoom[rummyGame.getSplitPrizeKey('userId3')] = false;
            copiedRoom[rummyGame.getDropCountKey('userId1')] = 1;
            copiedRoom[rummyGame.getDropCountKey('userId2')] = 2;
            copiedRoom[rummyGame.getDropCountKey('userId3')] = 3;
            copiedRoom['split-prize-counter'] = 0;
            rummyGameplayCacheServiceHIncrBy.returns(3);
            requestTemplateGet.returns({
                data:{
                    result:{
                        entryFees: 100,
                        adminComisionPerUser: 5,
                        totalPlayersToAllow: 6
                    }
                }
            });
            copiedRoom.winner = [];
            copiedRoom.rummyType = 'pool';
            copiedRoom.eliminatedPlayers = ['userId4','userId5','userId6'];
            const result = await rummyGame.splitPrize(copiedRoom, 'userId1', callback);
            expect(result).to.not.eql(null);
        });
        
    });
    

}

module.exports = {
    run
};