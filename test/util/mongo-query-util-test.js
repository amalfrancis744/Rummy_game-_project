const chai = require('chai');
const sinon = require('sinon');
var expect = chai.expect;
const User = require('../../model/user');
const mongoQueryUtil = require('../../util/mongo-query-util');

function run () {

    describe('Get Query Test', () => {
        it('it should return query', async() => {
            let query = {
                name: 'Bhavesh',
                email: 'bhavesh@gmail.com',
                sortBy: 'timestamp',
                sortOrder: 'desc',
                pageNo: 1,
                pageSize: 20,
            };
            const _query = mongoQueryUtil.getQuery(query);
            expect(_query.sortBy).to.eql(undefined);
            expect(_query.pageNo).to.eql(undefined);
        });
    });

    describe('Get Pagination Test', () => {
        it('it should return pagination', async() => {
            let query = {
                name: 'Bhavesh',
                email: 'bhavesh@gmail.com',
                sortBy: 'timestamp',
                sortOrder: 'desc',
                pageNo: 1,
                pageSize: 20,
            };
            const pagination = mongoQueryUtil.getPagination(query);
            expect(pagination.sort).to.not.eql(null);
            expect(pagination.limit).to.not.eql(null);
            expect(pagination.skip).to.not.eql(null);
        });
    });

    describe('Get Page Test', () => {

        var userFind;
        var userCount;
        beforeEach(function() {
            userFind = sinon.stub(User, 'find');
            userCount = sinon.stub(User, 'count');
        });
    
        afterEach(function() {
            userFind.restore();
            userCount.restore();
        });

        it('it should return page', async() => {
            let query = {
                name: 'Bhavesh',
                email: 'bhavesh@gmail.com',
                sortBy: 'timestamp',
                sortOrder: 'desc',
                pageNo: 1,
                pageSize: 20,
            };
            userFind.returns([]);
            userCount.returns(200)

            const page =await mongoQueryUtil.getPage(User, query);
            expect(page.content).to.eql([]);
            expect(page.count).to.eql(200);
        });
    });

}

module.exports = {
    run
}