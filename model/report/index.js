const reportModule = require('./report');

module.exports ={
   
    //Fetch Particular Data 
    getReport : async(data) => {
        return await reportModule.findOne(data).lean().populate('user reported_player gameId');
    },
    //Saving Document
    saveReport : async ( data ) => {
        return await reportModule(data).save();
    },
    //Table-listing
    reportListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await reportModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order}).populate('user reported_player gameId')
    },
    // Fetch all Report
    getAllReport : async (data ) => {
        return await reportModule.find(data).lean().sort({createdAt : -1}).populate("user reported_player gameId")
    },
    //Updating Document
    updateReport : async (id , data) => {
        return await reportModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropReport : async ( data ) => {
        return await reportModule.deleteOne(data);
    },
    //Counting Document
    reportCountDocument: async ( option ) => {
        return await reportModule.countDocuments(option)
    },

}