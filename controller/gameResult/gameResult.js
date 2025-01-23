const response = require('../../services/response')
const queries = require('../../model/gameResult/index');
const userQuery = require('../../model/users/index');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {


    //Adding Wallet Details
    addGameResult : async ( req , res ) => {
        let { gameCode , rummyType, gameType, opponent, matchAmount, resultType, amount, } = req.body;
        if(!gameCode ||! rummyType || !gameType || !opponent || !matchAmount || !resultType || !amount) 
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Invalid Parameters"
                )
            )
        if(!ObjectId.isValid(opponent)){
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Opponent id is not in valid format"
                )
            )
        }
        
        const userExist = await userQuery.getUser({_id:ObjectId(opponent)})

        if (!userExist)
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Opponent is unauthorized"
                )
            )
        try{
            let savingGameResult = await queries.saveGameResult(
                { 
                    user: req.auth._id , 
                    game_code : gameCode,
                    rummy_type: rummyType,
                    game_type: gameType,
                    opponent: opponent,
                    match_amount: matchAmount,
                    result_type: resultType,
                    amount: amount,
                });
            
            return (
                await response.successResponse(
                    res,
                    200,
                    "Game Result has been added",
                    {
                        _id : savingGameResult?._id,
                        user:savingGameResult?.user,
                        game_code : savingGameResult?.game_code,
                        rummy_type : savingGameResult?.rummy_type,
                        game_type : savingGameResult?.game_type,
                        opponent : savingGameResult?.opponent,
                        match_amount:savingGameResult?.match_amount,
                        result_type:savingGameResult?.result_type,
                        amount:savingGameResult?.amount,
                        created_at: savingGameResult?.createdAt,
                    }
                )
            )
        }catch(err){
            console.log(`Add Transaction error occured : ${err}`);
            console.log(`Add Transaction error occured : ${err}`);
            return res.status(200).send({code:400 , status:'failure',message:err?.message});
        }
    },
    //Fetch All Wallet Details
    fetchGameResult : async (req , res ) => {
        try{
            let {recordsPerPage , pageNumber, type} = req.query;
            if(!recordsPerPage || !pageNumber || !type)
                return (
                    await response.errorResponse(
                        res ,
                        401,
                        "Invalid Query Parameters"
                )
            )
            const start_length = (pageNumber - 1) * recordsPerPage;
            const data = {
                user:req.auth._id,
                rummy_type:type
            }
            const totalRecord = await queries.gameResultCountDocument(data);
            console.log(totalRecord)
            let gameResult = await queries.gameResultListing(data, recordsPerPage, start_length);
            const page = parseInt(totalRecord/recordsPerPage)
            const totalPage = totalRecord%recordsPerPage !=0 ? page+1 : page
            if(gameResult?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );
                gameResult.map((e , index) =>{
                    e['serialNo'] = index + 1;
                    e.opponent ={
                        ...e.opponent,
                        profilepic: `${process.env.URL}/uploads/${e.opponent.profilepic}`
                    }
                })

            return await response.listSuccessResponsePage(
                res,
                200 , 
                'Game Result List' , 
                gameResult ,
                gameResult?.length ,
                totalPage
            );

        }catch(err){
            console.log(`Fetch gameResult error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },

}