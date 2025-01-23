const express = require('express');
const router = express.Router();
const gameResultController = require('../controller/gameResult/gameResult');
const authorize = require('../services/authorization');
const roles = require('../services/roles');


//****************User-side End points ****************/
router.post('/add-game-result' , authorize(roles.User) , gameResultController?.addGameResult);
router.get('/fetch-game-result-list' ,authorize(roles.User) , gameResultController?.fetchGameResult);

module.exports = router;