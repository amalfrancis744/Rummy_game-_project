const queries = require("../../../model/tournament/index");
const response = require("../../../services/response");
const commonService = require("../../../services/common");
const constants = require("../../../util/constants");

module.exports = {
    //*********************************PAGES*************************************** */

    //Load Edit Table Page
    loadEditTournament : async ( req,res) => {
        
        const id = req.params.id
        console.log("id-----",id)
        const tournamentData = await queries.getTournament({_id:id})
        let admin ={
            url : process.env.URL,
            adminProfile : '',
            token: req.cookies.token,
            
        }
        const data = { tournamentData, admin };
        commonService.redirecting( req, res , 'pages/tournamentManagement/editTournament' , data)
    },
    
    //***************Admin-side Table Management functions *******************************/

    //Creating a new table
    addTournament: async (req, res) => {
        console.log(req.body)
        let { gameplayType, entryFee, totalPlayer, adminCommission , pointValue , rummyPoints,hiddenWinningAmount} = req.body;

        console.log("Request-->" ,req.body)
        if (!entryFee ||!totalPlayer || !adminCommission || !pointValue || !gameplayType)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
        try{
            let winAmount = hiddenWinningAmount ; 
            
            gameplayType === constants?.RUMMY_TYPE?.POINT ? rummyPoints = "" : rummyPoints = rummyPoints
         
            if(gameplayType !== constants?.RUMMY_TYPE?.POINT && gameplayType !== constants?.RUMMY_TYPE?.POOL)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Game play type"
                    )
                )

            let tournamentExists = await queries.getTournament({
                $and : [
                    {no_of_players : totalPlayer },
                    {entry_fee : entryFee },
                    {rummy_type : gameplayType },
                    {rummy_points : rummyPoints },

                ] 
            });
            console.log("table--->" , tournamentExists);
            
            if (tournamentExists)
                return (
                    await response.errorResponse(
                        res, 
                        400, 
                        "Table already Exists"
                    )
                );

            let savingTournament = await queries.saveTournament({
                rummy_type: gameplayType,
                rummy_points : rummyPoints,
                no_of_players: totalPlayer,
                entry_fee: entryFee,
                win_amount: winAmount,
                admin_commission:adminCommission,
                point_value : pointValue
            });

            return await response.successResponse(
                res,
                200,
                "A New Table has been created successfully.",
                {
                _id: savingTournament?._id,
                rummy_type: savingTournament?.rummy_type,
                rummy_points : savingTournament?.rummy_points,
                no_of_players: savingTournament?.no_of_players,
                entry_fee: savingTournament?.entry_fee,
                win_amount: savingTournament?.win_amount,
                admin_commission: savingTournament?.admin_commission,
                created_at: savingTournament?.created_at,
                point_value : savingTournament?.point_value
                }
            );
        } catch (err) {
            console.log("Error occured while Creating table", err);
        return await response.errorResponse(res, 400, err?.message);
        }
    },
     //Listing via Data-table
    fetchTournament : async ( req , res ) => {
        try{ 

            const columnIndex = req.query.order ? req.query.order[0].column : undefined;
            let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
            const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
            const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
            const regex = value ? new RegExp(value, "i") : undefined;
            
            columnName = columnSortOrder == "asc" ? columnName : "-" + columnName
            const stringQuery = {
                $or: [
                    { game_mode: regex }
                ]
            };
            let numericQuery = {};
            if (!isNaN(parseFloat(value))) {
                const numericValue = parseFloat(value);
                numericQuery = {
                    $or: [
                        { rummy_points: numericValue },
                        { entry_fee: numericValue },
                        { win_amount: numericValue },
                        { admin_commission: numericValue },
                        { no_of_players : numericValue}
                    ]
                };
            }

            const searchOptions = value?{$or: [stringQuery, numericQuery]}:{};
            console.log("--------",searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder)
            
            let tableList = await queries.tournamentListing(searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            tableList.map((el) => {
                el['serialNo'] = indexes;
                el['admin_commission'] = el['admin_commission'] + "%";
                el['action'] = `<a href="/mgp-rummy/api/edit-tournament/${el._id}"><button  type="button" class="btn btn-info">
                <i class="fa fa-pencil"></i>
                    </button>
                    </a>`;
                el['rummy_type'] === constants?.RUMMY_TYPE?.POINT ? el['rummy_type'] = constants?.RUMMY_TYPE_MAPPING.POINT : el['rummy_type'] = constants?.RUMMY_TYPE_MAPPING.POOL
                el['rummy_points'] === ''?el['rummy_points'] = '-':el['rummy_points'] = el['rummy_points'];
                indexes++;
            });
            
            const recordsTotal = await queries.tournamentCountDocument(searchOptions);
            
            const data = {
                draw: req.query.draw,
                recordsFiltered: recordsTotal,
                recordsTotal: recordsTotal,
                data: tableList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }

    },
    // Updating table
    updateTournament: async (req, res) => {
        let { tableId,gameplayType, entryFee, totalPlayer, adminCommission , pointValue , rummyPoints, hiddenWinningAmount} = req.body;
        if (!entryFee ||!totalPlayer || !adminCommission || !pointValue  || !gameplayType)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
        try{
            let winAmount = hiddenWinningAmount ; 

            gameplayType === constants?.RUMMY_TYPE?.POINT ? rummyPoints = "" : rummyPoints = rummyPoints
            
            if(gameplayType !== constants?.RUMMY_TYPE?.POINT && gameplayType !== constants?.RUMMY_TYPE?.POOL)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Game play type"
                    )
                )

            let tournamentExists = await queries.getTournament({_id:tableId});

            if (!tournamentExists)
                return await response.errorResponse(res, 400, "Table Not Exists");
            
            let data = {
                rummy_type: gameplayType,
                rummy_points : rummyPoints,
                no_of_players : totalPlayer,
                entry_fee : entryFee,
                win_amount : winAmount,
                admin_commission : adminCommission,
                point_value : pointValue,

            }
            let savingTournament = await queries.updateTournament(tournamentExists._id,data);
            return res.status(200).send({
                code:200 , 
                status :'success' , 
                message:"Table has been updated successfully.",
                data : savingTournament
        
            });
        } catch (err) {
            console.log("Error occured while Creating table", err);
        return await response.errorResponse(res, 400, err?.message);
        }
    },
};