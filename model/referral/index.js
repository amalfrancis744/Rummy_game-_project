const referralModule = require('./referral');

module.exports ={


      //Fetching PArticular referral 
    getReferral : async (data) => {
        return await referralModule.findOne(data);
    },

    //Saving Document 
    saveReferral : async ( data ) => {
        return await referralModule(data).save();
    },

    //Referral Listing via data-table
    findReferrals : async(search  ,  limit , skip, orderBy , order) => {
        return await referralModule.find(search).lean().skip(skip).limit(limit).sort({[orderBy]:-order})
    },

    //Counting documents
    countingDocuments : async (options) => {
        return await referralModule.countDocuments(options);
    },
    
    //Listing for test
    getAllReferrals : async (data) => {
        return await referralModule.find().lean();
    }
}