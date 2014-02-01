var fs = require('fs');
var expect = require('chai').expect;

var StoicOdsContentWriter = require('../lib/stoic-ods-content-writer');

describe('When transforming the json data into content.xml', function() {
  var travels;
  var output = '';
  before(function(done) {
    travels = JSON.parse(require('fs').readFileSync('./test/assets/Travels.json'));
    output = new Buffer(1024);
    var contentWriter = new StoicOdsContentWriter(travels, function(c) { output += c; });
    contentWriter.parse(done);
  });
  it('Must do it', function() {
    expect(output).to.exist;
  });
});