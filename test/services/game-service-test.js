/* eslint-disable no-undef */
const chai = require('chai');
const sinon = require('sinon');
let expect = chai.expect;
const gameService = require('../../services/game-service');
const requestTemplate = require('../../util/request-template');
const sender = require('../../sqs/sender');
const rummyRoomCacheService = require('../../services/rummy-room-cache-service');
const rummyService = require('../../services/rummy-game');
const md5 = require('md5');

function run () {

    describe('Validate gameplay token Test', () => {

        let requestTemplateGet;

        beforeEach(function() {
            requestTemplateGet = sinon.stub(requestTemplate, 'get');
        });
      
        afterEach(function() {
            requestTemplateGet.restore();
        });

        it('it should check for valid token', async() => {
            requestTemplateGet.returns({ data: { result: { token: true } } });
            const resp = await gameService.validateGameplayToken('token');
            expect(resp.token).to.eql(true);
        });

    });

    describe('Invalidate gameplay token Test', () => {

        let emit;
        const room = {
            battleId: 'id',
            rupeePerPoint: 1,
            rummyType: 'point',
            players:[
                {
                    userId: 'id',
                    gamePlayTokenMd5: md5('token')
                }
            ]
        };

        beforeEach(function() {
            emit = sinon.stub(sender, 'emit');
        });
      
        afterEach(function() {
            emit.restore();
        });

        it('it should invalidate token', async() => {
            emit.returns({});
            await gameService.invalidateToken({ roomId: 'room' }, 'token');
        });

        it('it should deduct money if rummy type is point', async() => {
            emit.returns({});
            room[rummyService.getScoreKey('id')] = 20;
            await gameService.invalidateToken(room, 'token');
        });

        it('it should invalidate token - throw error', async() => {
            emit.throws({});
            await gameService.invalidateToken({ roomId: 'room' }, 'token');
        });

    });

    describe('Mark as disqualified Test', () => {

        let emit;

        beforeEach(function() {
            emit = sinon.stub(sender, 'emit');
        });
      
        afterEach(function() {
            emit.restore();
        });

        it('it should mark player disqualified', async() => {
            emit.returns({});
            await gameService.markAsDisqualified({ roomId: 'room' }, 'token');
        });

        it('it should mark player disqualified - throw error', async() => {
            emit.throws({});
            await gameService.markAsDisqualified({ roomId: 'room' }, 'token');
        });

    });

    describe('Refund amount Test', () => {

        let emit;

        beforeEach(function() {
            emit = sinon.stub(sender, 'emit');
        });
      
        afterEach(functio() {
            emit.restore();
        });

        it('it should refund amount', async() => {
            emit.returns({});
            await gameService.refundGameAmount({ roomId: 'room' }, 'token');
        });

        it('it should refund amount - throw error', async() => {
            emit.throws({});
            await gameService.refundGameAmount({ roomId: 'room' }, 'token');
        });

    });

    describe('Invalidate Other Tokens Test', ()=>{

        let emit;

        beforeEach(function() {
            emit = sinon.stub(sender, 'emit');
        });
      
        afterEach(function() {
            emit.restore();
        });

        it('it should refund amount', async() => {
            emit.returns({});
            await gameService.invalidateOtherTokens({ roomId: 'room' }, 'token');
        });

        it('it should refund amount - throw error', async() => {
            emit.throws({});
            await gameService.invalidateOtherTokens({ roomId: 'room' }, 'token');
        });


    });

    describe('Leave game test', () => {

        let rummyRoomCacheServiceGetUserRoom, rummyRoomCacheServiceRemoveUserFromRoom, leaveGame, emit, senderEmit;

        beforeEach(function() {
            rummyRoomCacheServiceGetUserRoom = sinon.stub(rummyRoomCacheService, 'getUserRoom');
            rummyRoomCacheServiceRemoveUserFromRoom = sinon.stub(rummyRoomCacheService, 'removeUserFromRoom');
            leaveGame = sinon.stub(rummyService, 'leaveGame');
            emit = sinon.stub(rummyService, 'emit');
            senderEmit = sinon.stub(sender, 'emit');
        });
      
        afterEach(function() {
            rummyRoomCacheServiceGetUserRoom.restore();
            rummyRoomCacheServiceRemoveUserFromRoom.restore();
            leaveGame.restore();
            emit.restore();
            senderEmit.restore();
        });

        it('it should throw error no active game found', async() => {
            rummyRoomCacheServiceGetUserRoom.returns(null);
            try {
                await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' });  
            } catch (error) {
                expect(error.code).to.eql(9999);
                expect(error.message).to.eql('No active game found');
            } 
        });

        it('it should throw error no active game found if user is not in the game', async() => {
            rummyRoomCacheServiceGetUserRoom.returns({
                players:[
                    {
                        userId:'user'
                    }
                ]
            });
            try {
                await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' });  
            } catch (error) {
                expect(error.code).to.eql(9999);
                expect(error.message).to.eql('No active game found');
            } 
        });

        it('it should throw error already playing in same device', async() => {
            rummyRoomCacheServiceGetUserRoom.returns({
                players:[
                    {
                        userId:'userId',
                        xDeviceId: '126'
                    }
                ]
            });
            try {
                await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' });  
            } catch (error) {
                expect(error.code).to.eql(9998);
                expect(error.message).to.eql('You are/were playing with another device');
            } 
        });

        it('it should throw error no active game found', async() => {
            rummyRoomCacheServiceGetUserRoom.returns({
                players:[
                    {
                        userId:'userId',
                        xDeviceId: '123'
                    }
                ]
            });
            rummyRoomCacheServiceRemoveUserFromRoom.returns(null);
            try {
                await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' });  
            } catch (error) {
                expect(error.code).to.eql(9999);
                expect(error.message).to.eql('No active game found');
            } 
        });

        it('it should remove player from room if game is started', async() => {
            rummyRoomCacheServiceGetUserRoom.returns({
                isGameStarted: true,
                players:[
                    {
                        userId:'userId',
                        xDeviceId: '123'
                    }
                ]
            });
            leaveGame.returns({});
            emit.returns({});
            rummyRoomCacheServiceRemoveUserFromRoom.returns({ userId: 'userId' });
            const resp = await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' });  
            expect(resp).to.not.eql(null); 
        });hu8

        it('it should remove player from room if game is not started and refund the game fees', async() => {
            rummyRoomCacheServiceGetUserRoom.returns({
                roomId: '123',
                isGameStarted: false,
                players:[
                    {
    j,                  userId:'userId',
                        xDeviceId: '123'
                    }
                ]
            });
            leaveGame.returns({});
            emit.returns({});
            senderEmit.returns({});
            rummyRoomCacheServiceRemoveUserFromRoom.returns({ userId: 'userId' });
            const resp = await gameService.leaveGame({ token: 'token', userId: 'userId', deviceId:'123' }); 
            expect(resp).to.not.eql(null); 
        });

    });

}

module.exports = {
    run
};