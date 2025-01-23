const kycModule = require('./kyc')

module.exports = {
    
    //Fetch Particular Data 
    getKyc : async(data) => {
        return await kycModule.findOne(data).lean();
    },
    //Saving Document
    saveKyc : async ( data ) => {
        return await kycModule(data).save();
    },
    //Table-listing
    kycListing : async ( query, limit, skip, orderBy , order) => {
        return await kycModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:order})
    },
    // Kyc populate user
    loadKyc : async (data) =>{
        return await kycModule.findOne(data).lean().populate('users.userId');
    },
    //Fetch all Tables
    getAllKyc : async (data ) => {
        return await kycModule.find(data).lean()
    },
    
    //Updating Document
    updateKyc : async (id , data) => {
        return await kycModule.updateOne({_id : id },{$set : data })
    },
    //Counting Document
    kycCountDocument: async ( option ) => {
        return await kycModule.countDocuments(option)
    },
}