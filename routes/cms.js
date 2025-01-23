const express = require('express');
const router = express.Router();
const cmsController = require('../controller/cms/cms');
const authorize = require('../services/authorization');
const roles = require('../services/roles');

//****************Admin-side End points ****************/
router.post('/add-cms' , authorize(roles.Admin) , cmsController?.addCms);
router.get('/fetch-cms-list' ,authorize(roles.Admin) , cmsController?.fetchCms)
router.put('/change-status/:id' , authorize(roles.Admin) , cmsController?.changeStatus);
router.get('/view-cms/:id'  ,cmsController?.viewCms);
router.put('/edit-cms/:id' , authorize(roles.Admin) , cmsController?.editCms);
router.delete('/drop-cms/:id' , authorize(roles.Admin) , cmsController?.dropCMS);



//*****************User-side End points ******************/
router.get('/cms-list' , cmsController?.cmsList);


module.exports = router;