const chai = require('chai');
const sinon = require('sinon');
var expect = chai.expect;
const AdminUser = require('../../../model/admin-user');
const adminUserUpdateProcessor = require('../../../sqs/receiver/processors/admin-user-update');

function run() {

    describe('It sync admin user details', () => {

        var adminUserFindById;

        beforeEach(function () {
            adminUserFindById = sinon.stub(AdminUser, 'findById');
        });

        afterEach(function () {
            adminUserFindById.restore();
        });

        it('it should create admin user', async() => {
            let req = {
                body:{
                    name: 'bhavesh'
                },
                log:(...args) => {}
            };
            adminUserFindById.returns(null);
            adminUserUpdateProcessor(req);
        });

        it('it should update admin user', async() => {
            let req = {
                body:{
                    name: 'bhavesh'
                },
                log:(...args) => {}
            };
            adminUserFindById.returns({_id:"id"});
            adminUserUpdateProcessor(req);
        });
    });
}

module.exports = {
    run
}

