const express = require('express');
const router = express.Router();
const bankDetailsController = require('../controller/bankDetails/bankDetails');
const authorize = require('../services/authorization');
const roles = require('../services/roles');


//****************User-side End points ****************/
router.post('/add-bank-details' , authorize(roles.User) , bankDetailsController?.addBankDetails);
router.get('/fetch-bank-details-list' ,authorize(roles.User) , bankDetailsController?.fetchBankDetails);

module.exports = router;