const gameModeQuery = require('../../model/gameModes/index');
const moment = require('moment');
const commonService = require('../../services/common');
const response = require('../../services/response');


module.exports = {

    //Add Game Modes
    addGameModes : async ( req , res ) => {
        const { mode } = req.body;

        if(!mode) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            );

        try{
            let newCode;
            newCode = mode.toLowerCase();
            let modeExists = await gameModeQuery.getGameMode({code :newCode.replace(/\s/g,'_') });

            if(modeExists)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Game mode already Exist"
                    )
                );


            let savingGameMode = await gameModeQuery.saveGameMode({
                gametype : mode.toUpperCase(),
                code : newCode.replace(/\s/g,'_'),
                createdAt : moment().format('LLL')
            });

            return (
                await response.successResponse(
                    res,
                    200,
                    "Game mode has been added successfully",
                    savingGameMode
                )
            )


        }catch(err){

            console.log("Error occured while creating game modes" , err);
            
            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            )
        }
    },
    //Removing Game Modes
    dropGameMode : async (req , res ) =>{

        const { id  } = req.body;

        if(!id)
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            );

        try{

            let modeExists = await gameModeQuery.getGameMode({_id : id});

            if(!modeExists)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Game mode"
                    )
                );

            await gameModeQuery.removeGameMode({_id:modeExists?._id});

            return (
                await response.successResponse(
                    res,
                    200,
                    "Game mode has been removed successfully"
                )
            )

        }catch(err){
            
            console.log("Error occured while removing Game mode", err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            );
        }


    },
    //Fetching Game modes for Admin-side
    fetchModes : async ( req , res ) => {

        try{

            let gameModes = await gameModeQuery.getAllGameMode();

            if(!gameModes)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Game modes found"
                    )
                );

            return (
                await response.successResponse(
                    res,
                    200,
                    "Fetching Game modes",
                    gameModes
                )
            )



        }catch(err){

            console.log("Error occured while fetching game modes" , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            );
        }
    },
    //Fetching game modes for user-side
    frontFetchModes : async ( req , res ) => {

        try{

            let gameModes = await gameModeQuery.getAllGameMode();

            if(!gameModes)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Game modes found"
                    )
                );

            return (
                await response.successResponse(
                    res,
                    200,
                    "Fetching Game modes",
                    gameModes
                )
            )



        }catch(err){

            console.log("Error occured while fetching game modes" , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            );
        }
    }
}
