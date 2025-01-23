const multer = require('multer')
const fs = require('fs')
const path = require('path')


var storage = multer.diskStorage({

    destination:function(req,file,cb){
      let ext = path.extname(file.originalname);
      if(file.fieldname==="image"){
      console.log("image Extension" , ext)
        if( ext !==".png" || ext!==".webp " || ext !== ".jpg" || ext !== ".jpeg"){
          req.filetype = "Not Supported"
        }
          cb(null,"assets/uploads")
        
      }else if(file.fieldname === "csv"){
        if(ext !== ".csv"){
          req.filetype ="Not Supported"
        }
          cb(null,"assets/csvFiles") 
      }else if(file.fieldname==="passport" || file.fieldname==="driving_licence_front" || file.fieldname==="driving_licence_back" ){
        if( ext !==".png" || ext!==".webp " || ext !== ".jpg" || ext !== ".jpeg"){
            req.filetype = "Not Supported"
        }
        cb(null,"assets/uploads/kycdocuments")
    }
},
    filename: function (req, file, cb) { 
      let ext = path.extname(file.originalname);
      if(file.fieldname==="image"){
        cb(null, file.fieldname + '-' + Date.now()+ ext)
      }else if(file.fieldname==="csv"){
        cb(null, file.fieldname + '-' + Date.now()+ ext)
      }else if(file.fieldname==="passport" || file.fieldname==="driving_licence_front" || file.fieldname==="driving_licence_back" ){
        cb(null, file.fieldname + '-' + Date.now()+ ext)
      }
    }
});


//Storage for Product's jsonFile
// var jsonFileStorage = multer.diskStorage({
//   destination: 'assets/jsonFiles/',
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now()+ '.json')
//   }
// })

var upload = multer({ storage: storage  });

module.exports = upload ;