const bankDetailsModule = require('./bankDetails')

module.exports ={
   
    //Fetch Particular Data 
    getBankDetails : async(data) => {
        return await bankDetailsModule.findOne(data).lean();
    },
    //Saving Document
    saveBankDetails : async ( data ) => {
        return await bankDetailsModule(data).save();
    },
    //Table-listing
    bankDetailsListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await bankDetailsModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },
    // Fetch all Tables
    getAllBankDetails : async (data ) => {
        return await bankDetailsModule.find(data).lean().sort({createdAt : -1})
    },
    //Updating Document
    updateBankDetails : async (id , data) => {
        return await bankDetailsModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropBankDetails : async ( data ) => {
        return await bankDetailsModule.deleteOne(data);
    },
    //Counting Document
    bankDetailsCountDocument: async ( option ) => {
        return await bankDetailsModule.countDocuments(option)
    },

}
