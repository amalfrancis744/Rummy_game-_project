const express = require("express");
const router = express.Router();
const kycController = require('../../controller/admin/kyc/kyc');
const authorize = require('../../services/authorization');
const roles = require('../../services/roles');
const upload = require('../../services/multer');


// ********************Admin-side End points *******************************/
router.get('/fetch-kyc' , authorize(roles.Admin),  kycController?.fetchKyc);
router.get("/viewDoc/:id",kycController?.loadViewDoc);
router.get("/viewSingleDoc/:name/:id",kycController?.loadViewSingleDoc);
router.get("/documentDownload/:id",kycController.documentDownload);
router.post("/changeDocStatus/:id/:status",authorize(roles.Admin),kycController.changeDocStatus);



//***************User-side End points**********************/
router.post('/add-kyc-details' , authorize(roles.User),upload.fields([{ name: "passport", maxCount: 1 },{ name: "driving_licence_front", maxCount: 1 },{ name: "driving_licence_back", maxCount: 1 },]), kycController?.addKycDetails);
router.get('/fetch-kyc-list' ,authorize(roles.User) , kycController?.fetchKycList);

module.exports = router;