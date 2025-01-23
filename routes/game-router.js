const express = require('express');

const asyncHandler = require('../util/async-handler');
const router = express.Router();

const rummyRoomCacheService = require('../services/rummy-room-cache-service');
const rummyGameplayCacheService = require('../services/rummy-gameplay-cache-service');
const permission = require('../middleware/permission');
const { initGame, startCountdown, tossWinner, playCard, drawCard, endTurn, leaveGame, submit, pickCard, show, calResult } = require('../services/rummy-game');

router.get('/debug', asyncHandler(async () => {
  return rummyRoomCacheService.debugGameData();
}));

router.get('/debug-2', asyncHandler(async () => {
  return rummyGameplayCacheService.getRoomMap();
}));

router.get('/in-battle/:id', permission.isSystemCall, asyncHandler(async (req) => {
  const count = await rummyRoomCacheService.getUserCountByBattleId(req.params.id);
  return { count };
}));

router.get('/in-tournament/:id', permission.isSystemCall, asyncHandler(async (req) => {
  const count = await rummyRoomCacheService.getUserCountByTournamentId(req.params.id);
  return { count };
}));

router.get('/in-game/:id', permission.isSystemCall, asyncHandler(async (req) => {
  const count = await rummyRoomCacheService.getUserCountByGameId(req.params.id);
  return { count };
}));

router.post('/initialize',asyncHandler(async (req) => {
  const gameData = await initGame(req.body);
  return { gameData };
}));

router.post('/start', permission.isSystemCall, asyncHandler(async (req) => {
  const result = await startCountdown(req.body.gameId);
  return { result };
}));

router.post('/toss-winner', permission.isSystemCall, asyncHandler(async (req) => {
  const winner = await tossWinner(req.body.gameId);
  return { winner };
}));

router.post('/play-card', permission.isSystemCall, asyncHandler(async (req) => {
  const result = await playCard(req.body.gameId, req.body.card);
  return { result };
}));

router.post('/draw-card', permission.isSystemCall, asyncHandler(async (req) => {
  const result = await drawCard(req.body.gameId);
  return { result };
}));

router.post('/end-turn', permission.isSystemCall, asyncHandler(async (req) => {
  const result = await endTurn(req.body.gameId);
  return { result };
}));

router.post('/leave-game', asyncHandler(async (req, res) => {
  const { roomId, userId } = req.body;
  await leaveGame(roomId, userId, (response) => {
    res.json(response);
  });
}));

router.post('/pick-card', asyncHandler(async (req, res) => {
  const { roomId, userId, deck } = req.body;
  const room = await rummyGameplayCacheService.getRoomData(roomId);
  await pickCard(room, { deck }, userId, (response) => {
    res.json(response);
  });
}));

router.post('/show', asyncHandler(async (req, res) => {
  const { roomId, userId, card } = req.body;
  const room = await rummyGameplayCacheService.getRoomData(roomId);
  await show(room, { card }, userId, (response) => {
    res.json(response);
  });
}));

router.post('/submit', asyncHandler(async (req, res) => {
  const { roomId, userId, groups } = req.body;
  const room = await rummyGameplayCacheService.getRoomData(roomId);
  await submit(room, { groups }, userId, (response) => {
    res.json(response);
  });
}));

router.post('/result', asyncHandler(async (req, res) => {
  const { roomId, isFinal } = req.body;
  const results = await calResult(roomId, isFinal);
  res.json({ results });
}));

module.exports = router;
