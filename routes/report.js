const express = require('express');
const router = express.Router();
const reportController = require('../controller/report/report');
const authorize = require('../services/authorization');
const roles = require('../services/roles');

//*********Pages Routes *********************/
router.get('/view-cheating-report/:id' , reportController?.loadCheatingReport);

// ********************Admin-side End points *******************************/
router.get('/fetch-cheating-report' , authorize(roles.Admin),  reportController?.fetchCheatingReport);
router.get('/view-report-details/:id' , authorize(roles.Admin),  reportController?.viewCheatingReport);

//****************User-side End points ****************/
router.post('/report-player' , authorize(roles.User) , reportController?.reportPlayer);
router.get('/fetch-report' ,authorize(roles.User) , reportController?.fetchReport);

module.exports = router;