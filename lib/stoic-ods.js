var fs = require('fs');
var unzip = require('unzip');
var OdsContentHandler = require('./stoic-ods-content-handler');
var OdsStylesHandler = require('./ods-styles-handler');

function parseOds(filePath, options, done) {
  parseOdsStyles(filePath, function(e, odsStyles) {
    setImmediate(function() {
      parseOdsContent(filePath, odsStyles, options, done);
    });
  });
}

function parseOdsStyles(filePath, done) {
  var odsStylesHandler;

  fs.createReadStream(filePath).pipe(unzip.Parse())
  .on('entry', function(entry) {
    var fileName = entry.path;
    if (fileName === 'styles.xml') {
      odsStylesHandler = new OdsStylesHandler(entry);
      entry.pipe(odsStylesHandler.saxStream);
    } else {
      entry.autodrain();
    }
  }).on('close', function(e) {
    done(e, odsStylesHandler.getOdsStyles());
  });
}

function parseOdsContent(filePath, odsStyles, options, done) {
  var odsContentHandler;

  fs.createReadStream(filePath).pipe(unzip.Parse())
  .on('entry', function(entry) {
    var fileName = entry.path;
    if (fileName === 'content.xml') {
      odsContentHandler = new OdsContentHandler(entry, odsStyles, options);
      entry.pipe(odsContentHandler.saxStream);
    } else {
      entry.autodrain();
    }
  }).on('close', function(e) {
    var header = makeHeader(filePath);
    header.sheets = odsContentHandler.sheets;
    done(e, header);
  });
}

function makeHeader(filePath) {
  var nameMatch = filePath.match(/([^\/]*)$/);
  var name = filePath;
  if (nameMatch && nameMatch[1]) {
    var toks = nameMatch[1].split('.');
    toks.pop();
    name = toks.join('.');
  }
  var header = {
    spid: filePath,
    name: name
  };

  return header;
}

exports.parseOds = parseOds;