
module.exports = function(doIndent, outputStream) {
  var printer = {};
  var print;

  if (typeof outputStream === 'function') {
    print = outputStream;
  } else if (outputStream.pause) {
    print = function print (c) {
      if (!outputStream.write(c)) {
        outputStream.pause();
      }
    };
    outputStream.on("drain", function () {
      outputStream.resume();
    });
  } else {
    print = function print (c) {
      outputStream.write(c);
    };
  }



  function entity(str) {
    return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escape(str) {
    return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

printer.doIndent = doIndent;
printer.level = 0;
printer.states = [];
printer.tagstack = [];
printer.tabstop = 2;
// if (doIndent) {
  printer.indent = function () {
    if (printer.doIndent !== true) { return; }
    print("\n");
    for (var i = printer.level; i > 0; i --) {
      for (var j = printer.tabstop; j > 0; j --) {
        print(" ");
      }
    }
  };
// } else {
//   printer.indent = function() {};
// }
  printer.onopentag = function (tag) {
try{
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
    printer.states.push(2);
    printer.states.push(1);
    printer.tagstack.push(tag.name);
    printer.indent();
    printer.level ++;
    print("<"+tag.name);
    for (var i in tag.attributes) {
      var v = tag.attributes[i];
      print(" "+i+"=\""+entity(tag.attributes[i])+"\"");
    }
    // print(">");
}catch(x){
  console.log('oh no', x);
}
  };

  printer.ontext = function ontext(text) {
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
    printer.states.push(2);
    printer.indent();
    print(escape(text));
  };
  printer.ondoctype = function(doctype) {
    print(doctype);
  };
  printer.onprocessinginstruction = function(procinst) {
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
    printer.states.push(2);
    printer.indent();
    print('<?' + procinst.name + ' ' + procinst.body + '?>');
  };

  printer.onclosetag = function (tag) {
    printer.level --;
    var currentTag = printer.tagstack.pop();
    if (currentTag !== tag) {
      console.trace('trying to close with a different tag', currentTag, tag);
      process.exit();
    }
    var state = printer.states.pop();
    if (state === 1) {
      print("/>");
    } else {
      printer.indent();
      print("</"+tag+">");
    }
  };

  printer.oncdata = function (data) {
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
    printer.states.push(2);
    printer.indent();
    print("<![CDATA["+data+"]]>");
  };

  printer.oncomment = function (comment) {
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
    printer.states.push(2);
    printer.indent();
    print("<!--"+comment+"-->");
  };

  printer.onend = function () {
    var state = printer.states.pop();
    if (state === 1) {
      print(">");
    }
  };


  printer.onerror = function (error) {
    console.error(error);
    throw error;
  };

  return printer;
};