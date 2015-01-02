var path = require('path');

var bb = require('blue-button');
var bbm = require('blue-button-model');
var bbg = require('blue-button-generate');

module.exports = function(grunt) {
	"use strict";

	var fs = require('fs');
	var path = require('path');
	var jsondiffpatch = require('jsondiffpatch');

	grunt.registerMultiTask('blue-button', "Parse CCDA, C32, or CMS files.", function() {
		var options = this.options({
			validate: false,
			postfix: ""
		});
		this.files.forEach(function(filePair) {
			var dest = filePair.dest;

			filePair.src.forEach(function(src) {
				var content = grunt.file.read(src);
        		var result = bb.parse(content);
        		if (options.validate) {
        			var valid = bbm.validator.validateDocumentModel(result);
			        if (!valid) {
			        	var errs = JSON.stringify(bb.validator.getLastError(), null, 4);
            			grunt.fail.warn("Validation failed for " + src + ": \n" + errs);
        			}
        		}
        		var baseName = path.basename(src, path.extname(src));
        		var destName = baseName + options.postfix + '.json';
        		var destPath = path.join(dest, destName);
        		var destContent = JSON.stringify(result, undefined, 2);
        		grunt.file.write(destPath, destContent);
			});
		});
	});

	grunt.registerMultiTask("blue-button-generate", "Generate CCDA from BB JSON.", function() {
		var options = this.options({
			postfix: ""
		});
		this.files.forEach(function(filePair) {
			var dest = filePair.dest;

			filePair.src.forEach(function(src) {
				var content = grunt.file.read(src);
        		var json = JSON.parse(content);
        		var xml = bbg.generateCCD(json);
        		var baseName = path.basename(src, path.extname(src));
        		var destName = baseName + options.postfix + '.xml';
        		var destPath = path.join(dest, destName);
        		grunt.file.write(destPath, xml);
			});
		});
	});

	grunt.registerMultiTask("blue-button-jsondiff", "Compares files in directories.", function() {
		var options = this.options({
			postfix: ""
		});
		this.files.forEach(function(filePair) {
			var dest = filePair.dest;

			if (filePair.src.length != 2) {
				grunt.fail.fatal("Exactly two paths needs to be specified.");
			}
			filePair.src.forEach(function(src) {
				if (! grunt.file.isDir(src)) {
					grunt.fail.fatal("Specified paths are not directories.");
				}
			});

			var fileNames0 = fs.readdirSync(filePair.src[0]);
			var fileNames1 = fs.readdirSync(filePair.src[1]);
			var compared = {};
			var diffResults = {};
			fileNames0.forEach(function(fileName) {
				var path1 = path.join(filePair.src[1], fileName);
				if (grunt.file.exists(path1)) {
					var path0 = path.join(filePair.src[0], fileName);
					var json0 = grunt.file.readJSON(path0);
					var json1 = grunt.file.readJSON(path1);
					var diff = jsondiffpatch.diff(json0, json1);
					if (diff) {
						diffResults[fileName] = {success: false, diff: diff};
					} else {
						diffResults[fileName] = {success: true};
					}
				} else {
					diffResults[fileName] = {success: false, missing: path1};
				}
			});
			fileNames1.forEach(function(fileName) {
				if (! diffResults[fileName]) {
					var path0 = path.join(filePair.src[0], fileName);
					diffResults[fileName] = {success: false, missing: path0};
				}
			});
			var result = Object.keys(diffResults).reduce(function(r, fileName) {
				var diffResult = diffResults[fileName];
				if (diffResult.success) {
					return r;
				} else {
					var output = JSON.stringify(diffResult, undefined, 2);
        			var baseName = path.basename(fileName, path.extname(fileName));
        			var destName = baseName + options.postfix + '.json';
        			var destPath = path.join(dest, destName);
        			grunt.file.write(destPath, output);
					r.push(fileName);
					return r;
				}
			}, []);
			if (result.length > 0) {
				var msg = 'Differences found: ' + result.join(',');
				grunt.fail.fatal(msg);
			}
		});
	});
};
