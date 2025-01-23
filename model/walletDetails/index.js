const walletDetailsModule = require('./walletDetails');

module.exports ={
   
    //Fetch Particular Data 
    getWalletDetails : async(data) => {
        return await walletDetailsModule.findOne(data).lean();
    },
    //Saving Document
    saveWalletDetails : async ( data ) => {
        return await walletDetailsModule(data).save();
    },
    //Table-listing
    walletDetailsListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await walletDetailsModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },
    // Fetch all Tables
    getAllWalletDetails : async (data ) => {
        return await walletDetailsModule.find(data).lean().sort({createdAt : -1})
    },
    //Updating Document
    updateWalletDetails : async (id , data) => {
        return await walletDetailsModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropWalletDetails : async ( data ) => {
        return await walletDetailsModule.deleteOne(data);
    },
    //Counting Document
    walletDetailsCountDocument: async ( option ) => {
        return await walletDetailsModule.countDocuments(option)
    },

}