var sax = require('sax');

function OdsStyleHandler(entry) {
  this.dataStyles = {};

  this.styles = {};

  this.currentStyle;
  this.currentStyleName;
  this.currentNumberFormat;
  this.currentTruncateOnOverFlow;

  this.styleMaps;

  this.textBuffer;

  var strict = false;
  var options = { xmlns: false, lowercase: true };
  var saxStream = sax.createStream(strict, options);
  Object.defineProperty(this, 'saxStream', {value: saxStream});

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

/**
 * @return a JSON object with all the info collected during the parsing.
 */
OdsStyleHandler.prototype.getOdsStyles = function() {
  var res = {
    dataStyles: this.dataStyles,
    styles: this.styles
  };
  var resolveMappedStyle = function(dataStyle, value) {
    if (dataStyle.styleMaps) {
      var choice;
      dataStyle.styleMaps.some(function(sm) {
        choice = sm;
      });
      if (choice) {
        return res.dataStyles[choice.style];
      }
    }
    return dataStyle;
  };
  res.getDataStyle = function(styleName, value) {
    if (res.dataStyles[styleName]) {
      var dataStyle = res.dataStyles[styleName];
      return resolveMappedStyle(dataStyle, value);
    }
    var st = res.styles[styleName];
    if (st) {
      return resolveMappedStyle(res.dataStyles[st], value);
    }
  };
  return res;
};

OdsStyleHandler.prototype.onopentag = function(node) {
  var self = this;
  var startStyle = function(styleType) {
    self.currentStyle = styleType;
    self.currentNumberFormat = '';
    self.currentStyleName = node.attributes['style:name'];
    var truncateOnOverFlow = node.attributes['number:truncate-on-overflow'];
    if (truncateOnOverFlow === 'false') {
      self.truncateOnOverFlow = false;
    }
  };

  var appendDateTimeFormat = function(shortLetter, longLetters) {
    var letter;
    if (node.attributes['number:style'] === 'long') {
      letter = longLetters;
    } else {
      letter = shortLetter;
    }
    if (self.truncateOnOverFlow === false) {
      self.truncateOnOverFlow = null; // consumed; if/else? not encountered in the wild so far.
      letter = '[' + letter + ']';
    }
    self.currentNumberFormat += letter;
  };

  if (node.name === 'style:style') {
    var name = node.attributes['style:name'];
    var family = node.attributes['style:family'];
    var dataStyle = node.attributes['style:data-style-name'];
    var families = this.styles[family];
    if (!families) {
      families = {};
      this.styles[family] = families;
    }
    families[name] = dataStyle;
  }

  else if (node.name === 'number:number-style') {
    startStyle('numberStyles');
  } else if (node.name === 'number:date-style') {
    startStyle('dateStyles');
  } else if (node.name === 'number:time-style') {
    startStyle('timeStyles');
  } else if (node.name === 'number:currency-style') {
    startStyle('currencyStyles');
  } else if (node.name === 'number:percentage-style') {
    startStyle('percentageStyles');
  } else if (node.name === 'number:text-style') {
    startStyle('textStyles');
  }

  else if (node.name === 'number:text') {
    this.textBuffer = '';
  }

  else if (node.name === 'number:day') {
    appendDateTimeFormat('d', 'dd');
  } else if (node.name === 'number:month') {
    appendDateTimeFormat('m', 'mm');
  } else if (node.name === 'number:year') {
    appendDateTimeFormat('yy', 'yyyy');
  } else if (node.name === 'number:era') {
    console.warn('Not sure what to do with an era.');
    if (node.attributes['number:style'] === 'long') {
      this.currentNumberFormat += '????';
    } else {
      this.currentNumberFormat += '??';
    }
  } else if (node.name === 'number:day-of-week') {
    appendDateTimeFormat('ddd', 'dddd');
  } else if (node.name === 'number:week-of-year') {
    this.currentNumberFormat += 's';
  } else if (node.name === 'number:quarter') {
    this.currentNumberFormat += 's';
  } else if (node.name === 'number:hours') {
    appendDateTimeFormat('h', 'hh');
  } else if (node.name === 'number:am-pm') {
    this.currentNumberFormat += 'AM/PM';
  } else if (node.name === 'number:minutes') {
    appendDateTimeFormat('m', 'mm');
  } else if (node.name === 'number:seconds') {
    if (node.attributes['number:style'] === 'long') {
      this.currentNumberFormat += 'ss';
    } else {
      this.currentNumberFormat += 's';
    }
    var dec = node.attributes['number:decimal-places'];
    if (dec) {
      try {
        dec = parseInt(dec, 10);
        if (dec > 0) {
          this.currentNumberFormat += '.';
          for (var idec = 0; idec < dec; idec++) {
            this.currentNumberFormat += '0';
          }
        }
      } catch(x) {
        console.warn('Unable to parse an integer for the attribute number:decimal-places "' + dec +"'.");
      }   
    }
  }

  else if (node.name === 'style:map') {
    if (!this.styleMaps) {
      this.styleMaps = [];
    }
    var condition = node.attributes['style:condition'];
    var applyStyleName = node.attributes['style:apply-style-name'];
    this.styleMaps.push({ condition: condition, style: applyStyleName });
  }
};

OdsStyleHandler.prototype.ontext = function(text) {
  if (typeof this.textBuffer === 'string') {
    this.textBuffer += text;
  }/* else if (text.trim()) {
    console.log('discarded', text);
  }*/
};

OdsStyleHandler.prototype.onclosetag = function(tagname) {
  var self = this;
  var addStyle = function() {
    var descr = { numberFormat: self.currentNumberFormat, type: self.currentStyle };
    if (self.styleMaps) {
      descr.styleMaps = self.styleMaps;
    }
    self.dataStyles[self.currentStyleName] = descr;
    self.currentStyle = null;
    self.currentStyleName = null;
    self.currentNumberFormat = null;
    self.truncateOnOverFlow = null;
    self.styleMaps = null;
  }; 
  if (tagname === 'number:number-style' ||
      tagname === 'number:date-style' || 
      tagname === 'number:time-style' ||
      tagname === 'number:currency-style' ||
      tagname === 'number:percentage-style' ||
      tagname === 'number:text-style') {
    addStyle();
  } else if (tagname === 'number:text') {
    if (this.textBuffer) {
      this.currentNumberFormat += this.textBuffer;
      this.textBuffer = null;
    }
  }
};

module.exports = OdsStyleHandler;