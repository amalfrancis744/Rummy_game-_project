const tempUserModule = require('./tempUser');


module.exports = {
        //Fetch Particular Temp User
        getTempUser : async ( data ) => {
            return await tempUserModule.findOne(data);
        },
    
        //SAving Document
        saveTempUser : async ( data ) => {
            return await tempUserModule(data).save();
        },
    
        //Updating Temp User 
        updateTempUser : async ( id , data ) => {
            return await tempUserModule.updateOne({_id : id} , {$set : data})
        },
    
        //Deleting Temporary User
        dropTempUser : async (data ) => {
            return await tempUserModule.deleteOne(data)
        },
    
        //Updating OTP
        updateOTP : async ( id , data ) => {
            return await tempUserModule.updateOne({ _id : id } , {$set : data } )
        },
}