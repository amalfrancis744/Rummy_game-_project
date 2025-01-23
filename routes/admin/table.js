const express = require('express');
const router = express.Router();
const tableController = require('../../controller/admin/table/table');
const authorize = require('../../services/authorization');
const adminAuth = require('../../services/adminAuth');
const roles = require('../../services/roles');


// ********************Admin-side table management routes *******************************/
router.post('/addTable' , authorize(roles.Admin) , tableController?.addTable);
router.get('/fetch-tables' ,  tableController?.fetchTable);
router.get('/edit-table/:id', adminAuth, tableController?.loadEditTable);
router.put('/updateTable' , authorize(roles.Admin) , tableController?.updateTable);


//**********************User-side endpoints *******************************************/
router.post('/fetch-entryFees' , authorize(roles.User) , tableController?.fetchEntryFee);
router.post('/fetch-entryFees-list' , authorize(roles.User) , tableController?.fetchEntryFeeList);


module.exports = router;