/*
    Example of query object:

        const query = {
            name: 'Sagar',
            email: 'sagar@gmail.com',
            sortBy: 'timestamp',
            sortOrder: 'desc',
            pageNo: 1,
            pageSize: 20,
        };
 
 */

function getQuery(query = {}) {
    const copy = { ...query };
    for (const key in copy) {
        if (key.startsWith('page') || key.startsWith('sort') || key.startsWith('off')) {
            delete copy[key];
        }
    }
    return copy;
}

/*
    Example of query object:
 
        const query = {
            sortBy: 'timestamp',
            sortOrder: 'desc',
        };
 
        or
 
        const query = {
            sortBy: ['score', 'updatedAt'],
            sortOrder: ['desc', 'asc'],
        };
 
 */
function getPagination(query = {}) {
    let sort;
    if (query.sortBy) {
        if (Array.isArray(query.sortBy)) {
            sort = {};
            query.sortBy.forEach((key, index) => {
                sort[key] = query.sortOrder[index] && 'asc' === query.sortOrder[index].toLowerCase() ? 1 : -1;
            });
        } else {
            sort = {
                [query.sortBy]: query.sortOrder && 'asc' === query.sortOrder.toLowerCase() ? 1 : -1,
            };
        }
    }
    const limit = +query.pageSize || 10;
    const pageNo = +query.pageNo && +query.pageNo > 0 ? +query.pageNo : 1;
    const offSet = query.offSet || 0;
    return {
        sort,
        limit,
        skip: ((pageNo - 1) * limit) + offSet
    };
}

async function getPage(model, query) {
    const pageable = getPagination(query),
        criteria = getQuery(query);
    const content = await model.find(criteria, null, pageable);
    const count = await model.count(criteria);
    return { content, count };
}

/**
 * 
 * @param {*} model 
 * @param {*} pipeline - aggregate pipeline without 1st match and last pagination pipeline
 * @param {*} query - req.query
 * @returns 
 */
async function getAggregatePage(model, pipeline, query) {
    const pageable = getPagination(query);
    const facet = {
        metadata: [{ $count: 'total' }],
        content: [{ $skip: pageable.skip }, { $limit: pageable.limit }]
    };
    if (pageable.sort) {
        pipeline.push({
            $sort: pageable.sort
        });
    }
    pipeline.push({ $facet: facet });
    const match = getQuery(query);
    if (Object.keys(match).length) {
        pipeline.splice(0, 0, {
            $match: match
        });
    }
    const result = await model.aggregate(pipeline);
    return {
        content: result[0].content,
        count: (result[0].metadata && result[0].metadata[0] && result[0].metadata[0].total) || null
    };
}

module.exports = {
    getQuery,
    getPagination,
    getPage,
    getAggregatePage,
};
