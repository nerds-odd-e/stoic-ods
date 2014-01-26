var expect = require('chai').expect;
var stoicOds = require('../lib/stoic-ods');
describe('When parsing the SmallDateFormats spreadsheet', function() {
  var temporary, name;
  before(function(done) {
    var filePath = 'test/assets/SmallDateFormats.ods';
    stoicOds.parseOds(filePath, function(e, spreadsheet) {
      temporary = spreadsheet.sheets;
      name = spreadsheet.name;
      // console.log('temporary', JSON.stringify(temporary, null, 2));
      done();
    });
  });
  it('Must have found a name', function() {
    expect(name).to.equal('SmallDateFormats');    
  });
  it('Must have parsed 1 sheet', function() {
    expect(Object.keys(temporary)).to.deep.equal(['Sheet1']);    
  });
  it('Must have resolved a number format', function() {
    expect(temporary.Sheet1.numberFormats[0][1]).to.equal('h:mm:ss');    
  });
});
