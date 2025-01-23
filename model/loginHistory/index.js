const userLoginHistory = require('./userLoginHistory');


module.exports = {

     //Fetch particular document from DB
     getUserLoginHistory : async (data) => {
        return await userLoginHistory.findOne(data);
    },
    //Saving document
    saveUserLoginHistory : async (data) => {
        return await userLoginHistory(data).save();
    },

    userLoginHistoryListing : async(search  ,  limit , skip, orderBy , order) => {
        return await userLoginHistory.find(search).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },

    //Updating Document
    updateUserLoginHistory : async ( id , data ) => {
        return await userLoginHistory.updateOne({_id : id} , {$set : data})
    },

    userLoginHistoryCount : async ( option ) => {
        return await userLoginHistory.countDocuments(option)
    },
}