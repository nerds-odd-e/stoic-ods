var expect = require('chai').expect;
var stoicOds = require('../lib/stoic-ods');

var files = ['test/assets/SmallDateFormats-google.ods',
              'test/assets/SmallDateFormats-libreoffice.ods'];

files.forEach(function(filePath) {
var fileName = filePath.split('/').pop().split('.')[0];
describe('When parsing the ' + fileName + ' spreadsheet', function() {
  var temporary, name;
  before(function(done) {
    var options = { collapseDefaultNumberFormat: true, useOfficeDate: true, useOfficeTime: true };
    stoicOds.parseOds(filePath, options, function(e, spreadsheet) {
      temporary = spreadsheet.sheets;
      name = spreadsheet.name;
      // console.log('temporary', JSON.stringify(temporary, null, 2));
      done();
    });
  });
  it('Must have found a name', function() {
    expect(name.indexOf('SmallDateFormats')).to.equal(0);    
  });
  it('Must have parsed 1 sheet', function() {
    expect(Object.keys(temporary)).to.deep.equal(['Sheet1']);    
  });
  it('Must have resolved a number format', function() {
    expect(temporary.Sheet1.numberFormats[0][1]).to.equal('h:mm:ss');    
  });
  it('Must have collapsed the a number format that is identical on the entire column', function() {
    expect(temporary.Sheet1.numberFormats.length).to.equal(1);    
  });
});

});
