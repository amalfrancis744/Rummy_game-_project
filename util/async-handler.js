const { validationResult } = require('express-validator');
const { BaseResponse, ErrorCodes } = require('../model/base-response');

const asyncHandler = callback => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { ...ErrorCodes.BAD_REQUEST, errorDescription: errors.array().map(e => `${e.param} ${e.msg}`).join(', ') };
    }
    callback(req, res, next)
        .then(BaseResponse)
        .then(result => {
            if (res.headersSent) {
                return this;
            }
            res.send(result);
            return this;
        })
        .catch(next);
};

module.exports = asyncHandler;
