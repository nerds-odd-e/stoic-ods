var expect = require('chai').expect;
var stoicOds = require('../lib/stoic-ods');
describe('When parsing the SmallDateFormats spreadsheet', function() {
  var temporary, name;
  before(function(done) {
    var filePath = 'test/assets/SmallDateFormats.ods';
    stoicOds.parseOds(filePath, function(e, spreadsheet) {
      temporary = spreadsheet.sheets;
      name = spreadsheet.name;
      done();
    });
  });
  it('Must have found a name', function() {
    expect(name).to.equal('SmallDateFormats');    
  });
  it('Must have parsed 1 sheet', function() {
    expect(Object.keys(temporary)).to.deep.equal(['Sheet1']);    
  });
});
