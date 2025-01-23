const cmsModule = require('./cms');


module.exports = {
    //Fetch Particular cms
    getCms : async ( data ) => {
        return await cmsModule.findOne(data);
    },

    //Saving Document
    saveCms : async ( data ) => {
        return await cmsModule(data).save();
    },

    //Updating Document
    updateCms: async ( id , data ) => {
        return await cmsModule.updateOne(id,{$set:data})
    },

    //Fetch all Document
    getAllCms: async () => {
        return await cmsModule.find().lean();
    },

    //Deleting a document
    removeCMS : async ( data ) =>{
        return await cmsModule.deleteOne(data);
    },
}