const adminModule = require('./admin');

module.exports = {
      //Fetch Particular Document
      getAdmin : async ( data ) => {
        return await adminModule.findOne(data).lean();
    },

    //Saving Document
    saveAdmin : async ( data ) => {
        return await adminModule(data).save();
    },
    //Updating Password
    updatePassword : async ( id , password ) => {
        return await adminModule.updateOne({_id : id } ,{$set : { password : password , resetToken : ''}})
    },

    //updateAdmin 
    updateAdmin : async (id , data ) => {
        return await adminModule.updateOne({_id : id } , {$set : data });
    },
}