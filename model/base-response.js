
const ErrorCodes = {

    INTERNAL_SERVER_ERROR: { status: 500, code: 100, message: 'Internal server error' },
    UNAUTHORIZED: { status: 401, code: 101, message: 'Unauthorized' },
    BAD_REQUEST: { status: 400, code: 102, message: 'Bad request' },
    GENERATE_BAD_REQUEST: (errorDescription) => {
        return { ...ErrorCodes.BAD_REQUEST, errorDescription };
    },
    NO_ACTIVE_GAME_FOUND: { status: 400, code: 9999, message: 'No active game found' },
    ALREADY_PLAYING_ON_OTHER_DEVICE: { status: 400, code: 9998, message: 'You are/were playing with another device' },
    MISSING_PERMISSION: { status: 403, code: 103, message: 'Missing permission' },

    INVALID_ID: { status: 400, code: 1000, message: 'Invalid id' },
};

const ValidationMessages = {
    GENERATE_INVALID_INPUT: arr => `- invalid input, possible values: ${arr.join(', ')}`,
    NOT_EMPTY: 'must not be null',
    MUST_BE_ARRAY: 'must be array',
    NOT_EMPTY_ARRAY: 'are required',
    INVALID_INPUT: '- invalid input',
    MUST_BE_BOOLEAN: '- must be not null boolean',
    MUST_BE_NUMBER: '- must be number',
    MUST_BE_NUMBER_GTE_1: '- must be number greater than or equal to 1',
    MIN_VALUE: '- minimum value must be ',
    NOT_EMPTY_BODY_ARRAY: 'body must be a non empty array',
};

exports.ErrorCodes = ErrorCodes;
exports.ValidationMessages = ValidationMessages;
exports.BaseResponse = result => {
    return { result };
};
