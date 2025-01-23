const express = require('express');
const router = express.Router();
const tournamentController = require('../../controller/admin/tournament/tournament');
const authorize = require('../../services/authorization');
const adminAuth = require('../../services/adminAuth');
const roles = require('../../services/roles');


// // ********************Admin-side table management routes *******************************/
router.post('/addTournament' , authorize(roles.Admin) , tournamentController?.addTournament);
router.get('/fetch-tournaments' ,  tournamentController?.fetchTournament);
router.get('/edit-tournament/:id', adminAuth, tournamentController?.loadEditTournament);
router.put('/updateTournament' , authorize(roles.Admin) , tournamentController?.updateTournament);


// //**********************User-side endpoints *******************************************/
// router.post('/fetch-entryFees' , authorize(roles.User) , tableController?.fetchEntryFee);


module.exports = router;