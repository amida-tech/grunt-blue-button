var path = require('path');

var bb = require('blue-button');
var bbm = require('blue-button-model');
var bbg = require('blue-button-generate');

module.exports = function(grunt) {
	"use strict";

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
};
