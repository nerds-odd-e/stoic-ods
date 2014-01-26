var sax = require('sax');

function OdsContentHandler(entry, odsStyles) {
  this.odsStyles = odsStyles;
  this.sheets = {};

  this.dataStyles = {};

  this.rowIndex;
  this.sheet;
  this.columnIndex;
  this.values;
  this.numberFormats;
  this.formulas;
  this.notes;
  this.cellOpened;
  this.textOpened;
  this.textBuffer;
  this.annotationBuffer;
  this.annotationOpened;

  var strict = false;
  var options = { xmlns: false, lowercase: true };
  this.saxStream = sax.createStream(strict, options);

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
  this.saxStream.on("error", function (e) {
    // unhandled errors will throw, since this is a proper node event emitter.
    console.error("error!", e);
    // clear the error
    this._parser.error = null;
    this._parser.resume();
  });
  this.saxStream.onend = function () {
    // parser stream is done, and ready to have more stuff written to it.
    entry.autodrain();
  };
}

OdsContentHandler.prototype.resolveStyle = function(cellStyleName) {
  var cellDataStyleName = this.dataStyles[cellStyleName];
  var dataStyle = this.odsStyles.getDataStyle(cellDataStyleName || cellStyleName);
  return dataStyle;
};

OdsContentHandler.prototype.onopentag = function(node) {
  //// table structure related parsing.
  if (node.name === 'table:table') {
    var sheetName = node.attributes['table:name'];
    this.sheet = {};
    this.sheets[sheetName] = this.sheet;
    this.rowIndex = -1;
  } else if (node.name === 'table:table-row') {
    this.columnIndex = -1;
    this.rowIndex++;
    this.values = [];
    this.numberFormats = [];
    this.formulas = [];
    this.notes = [];
  } else if (node.name === 'table:table-cell') {
    this.columnIndex++;
    var formula = node.attributes['table:formula'];
    if (formula) {
      this.formulas[this.columnIndex] = formula;
    }
    var cellStyle = node.attributes['table:style-name'];
    var officeType = node.attributes['office:value-type'];
    var officeCurrency = node.attributes['office:currency'];
    var officeValue = node.attributes['office:value'];
    var officeDateValue = node.attributes['office:date-value'];
    var officeTimeValue = node.attributes['office:time-value'];
    this.cellOpened = true;
    var dataStyle = this.resolveStyle(cellStyle);
    if (dataStyle) {
      this.numberFormats[this.columnIndex] = dataStyle.numberFormat;
    }
  } else if (node.name === 'text:p') {
    this.textOpened = true;
  } else if (node.name === 'office:annotation') {
    this.annotationOpened = true;
  }

  //// style related parsing... necessary for number formats :(
  else if(node.name === 'style:style') {
    var styleName = node.attributes['style:name'];
    var styleFamily = node.attributes['style:family'];// for example: table-cell
    var styleDataName = node.attributes['style:data-style-name'];
    if (styleName && styleDataName) {
      this.dataStyles[styleName] = styleDataName;
    }
  }
};

OdsContentHandler.prototype.ontext = function(text) {
  if (this.annotationOpened && this.textOpened) {
    if (this.annotationBuffer) {
      this.annotationBuffer += text;
    } else {
      this.annotationBuffer = text;
    }
  } else if (this.cellOpened && this.textOpened) {
    if (this.textBuffer) {
      this.textBuffer += text;
    } else {
      this.textBuffer = text;
    }
  }
};

OdsContentHandler.prototype.onclosetag = function(tagname) {
  if (tagname === 'text:p') {
    this.textOpened = false;
  } else if (tagname === 'table:table-cell') {
    this.cellOpened = false;
    if (this.textBuffer) {
      this.values[this.columnIndex] = this.textBuffer;
    }
    this.textBuffer = null;
  } else if (tagname === 'office:annotation') {
    this.annotationOpened = false;
    if (this.annotationBuffer) {
      this.notes[this.columnIndex] = this.annotationBuffer;
    }
    this.annotationBuffer = null;
  } else if (tagname === 'table:table-row') {
    this.columnIndex = -2;
    if (this.values.length !== 0) {
      if (this.sheet.values === undefined) {
        this.sheet.values = [];
      }
      this.sheet.values[this.rowIndex] = this.values;
      this.values = null;
    }
    if (this.numberFormats.length !== 0) {
      if (this.sheet.numberFormats === undefined) {
        this.sheet.numberFormats = [];
      }
      this.sheet.numberFormats[this.rowIndex] = this.numberFormats;
      this.numberFormats = null;
    }
    if (this.formulas.length !== 0) {
      if (this.sheet.formulas === undefined) {
        this.sheet.formulas = [];
      }
      this.sheet.formulas[this.rowIndex] = this.formulas;
      this.formulas = null;
    }
    if (this.notes.length !== 0) {
      if (this.sheet.notes === undefined) {
        this.sheet.notes = [];
      }
      this.sheet.notes[this.rowIndex] = this.notes;
      this.notes = null;
    }
  } else if (tagname === 'table:table') {
    this.sheet = null;
  }
};

module.exports = OdsContentHandler;