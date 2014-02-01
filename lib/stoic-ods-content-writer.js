var sax = require('sax');
var fs = require('fs');
var printer = require('./sax-printer');

function StoicOdsContentWriter(stoicJSON, outputStream, assetsDir) {
  this.stoicJSON = stoicJSON;
  this.outputStream = outputStream;
  this.assetsDir = assetsDir;
  var strict = false;
  var opts = { xmlns: false, lowercase: true };
  this.saxStream = sax.createStream(strict, opts);

  var self = this;
  this.saxStream.onopentag = function (node) {
    self.onopentag(node);
  };
  this.saxStream.onclosetag = function (tagname) {
    self.onclosetag(tagname);
  };
  this.saxStream.ontext = function (text) {
    self.ontext(text);
  };
  this.saxStream.ondoctype = function (doctype) {
    self.ondoctype(doctype);
  };
  this.saxStream.onend = function () {
    self.onend();
  };
  this.saxStream.onprocessinginstruction = function(procinst) {
    self.onprocessinginstruction(procinst);
  };
  this.saxStream.on("error", function (e) {
    // unhandled errors will throw, since this is a proper node event emitter.
    console.error("error!", e);
    // clear the error
    this._parser.error = null;
    this._parser.resume();
  });
}

module.exports = StoicOdsContentWriter;

StoicOdsContentWriter.prototype.parse = function(done) {
  if (!this.assetsDir) { this.assetsDir = __dirname + '/templates/ods1'; }
  var input = fs.createReadStream(this.assetsDir + '/content.xml');
  var self = this;
  this.saxStream.end = function () {
    console.log('done');
    // parser stream is done, and ready to have more stuff written to it.
    input.close();
    done();
  };
  this.xw = printer(false, this.outputStream);
  input.pipe(this.saxStream);//.pipe(this.outputStream);
};

StoicOdsContentWriter.prototype.ondoctype = function(doctype) {
  this.xw.ondoctype(doctype);
};
StoicOdsContentWriter.prototype.onprocessinginstruction = function(doctype) {
  this.xw.onprocessinginstruction(doctype);
};
StoicOdsContentWriter.prototype.onopentag = function(node) {
  if (node.name === 'office:spreadsheet') {
    this.xw.onopentag(node);
    this.writeTables();
    return;
  }
  this.xw.onopentag(node);
};
StoicOdsContentWriter.prototype.onclosetag = function(tagname) {
  this.xw.onclosetag(tagname);
};
StoicOdsContentWriter.prototype.ontext = function(text) {
  this.xw.ontext(text);
};
StoicOdsContentWriter.prototype.onend = function() {
  this.xw.onend();
};

StoicOdsContentWriter.prototype.writeTables = function() {
  var sheets = this.stoicJSON.sheets; 
  Object.keys(sheets).forEach(function(sheetName, index) {
    var sheet = sheets[sheetName];
    this.writeTable(sheetName, sheet, index);
  }, this);
};

StoicOdsContentWriter.prototype.writeTable = function(sheetName, sheet, index) {
  // this.xw.doIndent = true;
  //<table:table table:name="Sheet1" table:style-name="ta1" table:print="false">
  this.xw.onopentag({ name: 'table:table',
    attributes: { 'table:name': sheetName, 'table:table-style': 'ta1', 'table:print': false } });

  //<office:forms form:automatic-focus="false" form:apply-design-mode="false" />
  this.xw.onopentag({ name: 'office:forms', attributes: { 'form:automatic-focus': false, 'form:apply-design-mode': false } });
  this.xw.onclosetag('office:forms');

  sheet.values[0].forEach(function(val, colIndex) {
    //<table:table-column table:style-name="co1" table:default-cell-style-name="ce1" />
    this.xw.onopentag({ name: 'table:table-column',
      attributes: { 'table:style-name': "co1", 'table:default-cell-style-name': "Default" } });
    this.xw.onclosetag('table:table-column');
  }, this);

  // header
  //<table:table-row table:style-name="ro1">
  this.xw.onopentag({ name: 'table:table-row',
      attributes: { 'table:style-name': "ro1" } });
  sheet.values[0].forEach(function(val, colIndex) {
    // <table:table-cell office:value-type="string" calcext:value-type="string">
    this.xw.onopentag({ name: 'table:table-cell',
      attributes: { 'office:office-value': "string" } });
    if (sheet.annotations && sheet.annotations[0]) {
      var annot = sheet.annotations[0][colIndex];
      if (annot) {
        //<office:annotation office:display="false"><text:p><text:span>annotation</text:span></text:p></office:annotation>
        this.xw.onopentag({ name: 'office:annotation',
          attributes: { 'office:display': "false" } });
        this.xw.onopentag({ name: 'text:p'});
        this.xw.onopentag({ name: 'text:span'});
        this.xw.ontext(annot);
        this.xw.onclosetag('text:span');
        this.xw.onclosetag('text:p');
        this.xw.onclosetag('office:annotation');
      }
    }
    this.xw.onopentag({ name: 'text:p'});
    this.xw.ontext(val);
    this.xw.onclosetag('text:p');
    this.xw.onclosetag('table:table-cell');

  }, this);

  this.xw.onclosetag('table:table-row');
  for (var rowIndex = 1; rowIndex < sheet.values.length; rowIndex++) {
    var row = sheet.values[rowIndex];
    //<table:table-row table:style-name="ro2">
    this.xw.onopentag({ name: 'table:table-row',
      attributes: { /*'table:style-name': "ro2"*/ } });
    for (var colIndex = 0; colIndex < row.length; colIndex++) {
      var val = row[colIndex];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'object') {
        console.log('SUspecious', val);
        val = 'ERR';
      }
      //        <table:table-cell table:style-name="ce25"
      this.xw.onopentag({ name: 'table:table-cell',
        attributes: { 'office:office-value': "string" } });
      if (val !== '') {
        // if (val.toString().indexOf('&') !== -1) {
        //   console.log('oki', val);
        // } else {
          this.xw.onopentag({ name: 'text:p'});
          this.xw.ontext(val + '');
          this.xw.onclosetag('text:p');
        // }
      }
      this.xw.onclosetag('table:table-cell');
    }
    this.xw.onclosetag('table:table-row');
  }

  // </table:table>
  this.xw.onclosetag('table:table');

  // this.xw.doIndent = false;
};



