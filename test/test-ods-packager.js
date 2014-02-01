var packager = require('../lib/stoic-ods-packager');
var OdsPackager = packager.OdsPackager;
var fs = require('fs');
var expect = require('chai').expect;

describe('When running the packager', function() {
  var travels;
  before(function(done) {
    travels = JSON.parse(require('fs').readFileSync('./test/assets/Travels.json'));
    var odsPackager = new OdsPackager('./example-output.ods', travels);
    odsPackager.pack(done);
  });
  it('Must do it', function() {
    expect(fs.existsSync('./example-output.ods')).to.equal(true);
  });
});
// not veru useful to test now.
describe.skip('When running the zipper', function() {
  before(function(done) {
    packager.zipAssets('./example-zipper-output.ods', {}, {}, done);
  });
  it('Must do it', function() {
    expect(fs.existsSync('./example-zipper-output.ods')).to.equal(true);
  });
});

