const chai = require('chai');
const sinon = require('sinon');
var expect = chai.expect;
const actuatorService = require("../../services/actuator-service");
const Actuator = require('../../model/actuator');
function run () {
    var actuatorCreate;
    var actuatorDeleteMany;

    beforeEach(function() {
        actuatorCreate = sinon.stub(Actuator, 'create');
        actuatorDeleteMany = sinon.stub(Actuator, 'deleteMany');
    });
  
    afterEach(function() {
        actuatorCreate.restore();
        actuatorDeleteMany.restore();
    });

    describe('Get Database Status Test', () => {
        it('it should return UP', async() => {
            actuatorCreate.returns({});
            actuatorDeleteMany.returns({});
            const status = await actuatorService.getStatus();
            expect(status.database).to.eql('up');
        });

        it('it should return DOWN', async() => {
            actuatorCreate.throws();
            const status = await actuatorService.getStatus();
            expect(status.database).to.eql('down');
        })

    });
}

module.exports = {
    run
}