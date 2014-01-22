var fs = require('fs');
var unzip = require('unzip');
var sax = require('sax');

function parseOds(filePath, done) {
  var strict = false;
  var options = { xmlns: false, lowercase: true };
  var saxStream = sax.createStream(strict, options);

  var _entry;

  saxStream.onopentag = function (node) {
    // opened a tag.  node has "name" and "attributes"
    if (!node.name.match(/^style\:/)) {
      console.log(node.name, node.attributes);
    }
  };
  saxStream.onclosetag = function (tagname) {
    // opened a tag.  node has "name" and "attributes"
    if (!tagname.match(/^style\:/)) {
      console.log(tagname);
    }
  };
  saxStream.onend = function () {
    // parser stream is done, and ready to have more stuff written to it.
    console.log('And... done.');
    _entry.autodrain();
  };
  saxStream.on("error", function (e) {
    // unhandled errors will throw, since this is a proper node
    // event emitter.
    console.error("error!", e);
    // clear the error
    this._parser.error = null;
    this._parser.resume();
  });

  fs.createReadStream(filePath).pipe(unzip.Parse())
  .on('entry', function(entry) {
    var fileName = entry.path;
    console.log('fileName', fileName);
    if (fileName !== 'content.xml') {
      return entry.autodrain();
    }
    _entry = entry;
    entry.pipe(saxStream);
  }).on('close', done);
}

// http://office.microsoft.com/en-sg/excel-help/create-a-custom-number-format-HP010342372.aspx
var dateOrTimeNumberFormatSignatures = [
  'm', 'd', 'yy', 's', 'm', 'h'
];

function isDateFormattedCell(val) {
  if (val.rawnf && typeof val.raw === 'number' && typeof val.v === 'string') {
    return dateOrTimeNumberFormatSignatures.some(function(sig) {
      if (val.rawnf.indexOf(sig) !== -1) {
        return true;
      }
    });
  } else {
    return false;
  }
}

function makeHeader(filePath, xlsx) {
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