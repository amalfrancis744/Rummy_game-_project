const express = require('express');
const router = express.Router();
const gameModesController = require('../controller/gameModes/gameModes');
const authorize = require('../services/authorization');
const roles = require('../services/roles');


//Admin-side end points
router.post('/addGameModes' , authorize(roles.Admin) , gameModesController?.addGameModes);
router.get('/fetchGameModes' , authorize(roles.Admin) , gameModesController?.fetchModes);
router.delete('/dropGameModes/:id' , authorize(roles.Admin) , gameModesController?.dropGameMode);


//User-side endpoints
router.get('/fetch-game-modes' , authorize(roles.User) , gameModesController?.frontFetchModes);


module.exports = router;