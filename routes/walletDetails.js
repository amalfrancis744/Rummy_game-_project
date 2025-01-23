const express = require('express');
const router = express.Router();
const walletDetailsController = require('../controller/walletDetails/walletDetails');
const authorize = require('../services/authorization');
const roles = require('../services/roles');


//****************User-side End points ****************/
router.post('/add-wallet-details' , authorize(roles.User) , walletDetailsController?.addwalletDetails);
router.get('/fetch-wallet-details-list' ,authorize(roles.User) , walletDetailsController?.fetchwalletDetails);

module.exports = router;