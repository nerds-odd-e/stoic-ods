var fs = require('fs');
var Packer = require('zip-stream');
var StoicOdsContentWriter = require('./stoic-ods-content-writer');
// var StoicOdsStyleWriter = require('./stoic-ods-style-writer');
// var StoicOdsMetaWriter = require('./stoic-ods-meta-writer');

function OdsPackager(outputStreamOrFilePath, stoicJSON) {
  this.outputStreamOrFilePath = outputStreamOrFilePath;
  this.stoicJSON = stoicJSON;
}

OdsPackager.prototype.pack = function(done) {
  var saxPipes = {
    'content.xml': StoicOdsContentWriter/*,
    'styles.xml': StoicOdsStyleWriter*/
  };
  console.log('saxPipes', saxPipes);
  zipAssets(this.outputStreamOrFilePath, this.stoicJSON, saxPipes, done);
};

// executes this command on the cmd line to get the same:
// zip aha2.ods META-INF/manifest.xml styles.xml content.xml mimetype settings.xml meta.xml
function zipAssets(outputStreamOrFilePath, stoicJSON, saxPipes, done) {
  var assetsDir = __dirname + '/templates/ods1';
  var assetFiles = [ 'META-INF/manifest.xml', 'styles.xml', 'content.xml', 'meta.xml', 'settings.xml', 'mimetype' ];
  var archive = new Packer();

  archive.on('error', function(err) {
    console.log('error listened to here', err);
    throw err;
  });

  var output;
  if (typeof outputStreamOrFilePath === 'string') {
    output = fs.createWriteStream(outputStreamOrFilePath);
  } else {
    // assume it is a stream:
    output = outputStreamOrFilePath;
  }

  output.on('close', function(e) {
    done(e);
  });
  archive.pipe(output);

  var index = -1;
  var addOne = function(e) {
    index++;
    if (e || index === assetFiles.length) {
      if (e) { return done(e); }
      return archive.finalize();
    }
    var fileName = assetFiles[index];
    var SaxFilter = saxPipes[fileName];
    if (SaxFilter) {
      var filePath = './tmp_' + fileName;
      var tmpOutput = fs.createWriteStream(filePath);
      var filter = new SaxFilter(stoicJSON, tmpOutput);
      filter.parse(function() {
        tmpOutput.end(function() {
          addEntry(archive, fileName, filePath, addOne); 
        });
      });
    } else {
      addEntry(archive, fileName, assetsDir + '/' + fileName, addOne); 
    }
  };
  addOne();
}

function addEntry(archive, entryName, filePath, done) {
  fs.readFile(filePath, function(e, data) {
    if (e) { return done(e); }
    archive.entry(data, { name: entryName }, function(err) {
      setImmediate(function() {
        done(err);
      });
    });
  });  
}

exports.zipAssets = zipAssets;
exports.OdsPackager = OdsPackager;