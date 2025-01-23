
module.exports = {

    //Error Response
    errorResponse : ( res , code , message ) => {
        return res.status(200).send({ code : code , status :'failure' , message : message });
    },
    //Redirecting Message Response
    redirectResponse : ( res , code , message ) => {
        return res.status(200).send({ code : code , status :'redirect' , message : message });
    },
    //Success Response 
    successResponse : ( res , code , message , data  ) => {
        return res.status(200).send({code : code , status:'success' , message:message , data : data})
    },
    // List Success Response 
    listSuccessResponse : ( res , code , message , data ,records ) => {
        return res.status(200).send({code : code , status:'success' , message:message , data : data , totalRecords : records})
    },
    // List Success Response 
    listSuccessResponsePage : ( res , code , message , data ,records , totalPage ) => {
        return res.status(200).send({code : code , status:'success' , message:message , data : data , totalRecords : records , totalPage : totalPage})
    },
    //Socket Callback Error Response
     callbackErrorResponse : async ( code , flag , message ) => {
        return {
            code : code ,
            success : flag , 
            message : message,
            result : {}
        }
    },
    callbackSuccessResponse : async ( code , flag , message ) => {
        return {
            code : code ,
            success : flag , 
            message : message,
            result : {}
        }
    },
    
}