const axios = require('axios').default;
const queryString = require('query-string');
const md5 = require('md5');

const logger = require('../util/logger');

const { SERVICE_ENDPOINT_MAPPING, SERVICE_NAME } = require('../util/constants');

function call(req, service, method, path, body, headers = {}) {
    console.log("auth check by backend",req.header)
    if (!path.startsWith(service) && !path.startsWith(`/${service}`)) {
        path = `/${service}/api${path.startsWith('/') ? '' : '/'}${path}`;
    }
    let userId, userType;
    if (req.header) {
        userId = req.header('user.id');
        userType = req.header('user.type');
    } else {
        userId = req.userId;
        userType = req.userType;
    }
    const endpoint = process.env[SERVICE_ENDPOINT_MAPPING[service]];
    const url = endpoint + path;
    return axios.request({
        url,
        method,
        data: body,
        headers: {
            ...headers,
            'eg-request-id': req.traceId || '-',
            'x-api-key': process.env.INTER_COMMUNICATION_API_KEY,
            'user.id': userId || '',
            'user.type': userType || ''
        },
    });
}

function get(req, service, path, query, headers = {}) {
    if (query) {
        path += `?${queryString.stringify(query)}`;
    }
    return call(req, service, 'GET', path, {}, headers);
}

function post(req, service, path, body, headers = {}) {
    return call(req, service, 'POST', path, body, headers);
}

function put(req, service, path, body, headers = {}) {
    return call(req, service, 'PUT', path, body, headers);
}

function del(req, service, path, body, headers = {}) {
    return call(req, service, 'DELETE', path, body, headers);
}

function generateRequestObject(traceId) {
    const id = md5(traceId);
    const logId = [SERVICE_NAME, `traceId[${traceId}]`, `spanId[${id}]`, 'user[-]'].join(' ');
    return {
        id,
        traceId,
        logId,
        log: (...args) => {
            logger.info([new Date().toISOString(), logId, ...args].join(' '));
        },
        error: (...args) => {
            logger.error([new Date().toISOString(), logId, ...args].join(' '));
        },
    };
}

module.exports = {
    get,
    post,
    put,
    del,
    generateRequestObject,
};
