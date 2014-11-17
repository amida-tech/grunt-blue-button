"use strict";

var bb = require('blue-button');
var path = require('path');



module.exports = function(grunt) {
	grunt.registerMultiTask('blue-button', "Parse CCDA files.", function() {
		this.files.forEach(function(filePair) {
			var dest = filePair.dest;

			filePair.src.forEach(function(src) {
				var content = grunt.file.read(src);
				var sensed = bb.senseString(content);
				var cms = sensed.type === 'cms';
        		var result = cms ? bb.parseText(content) : bb.parseString(content);

        		var baseName = path.basename(src, path.extname(src));
        		var destName = baseName + '.json';
        		var destPath = path.join(dest, destName);
        		var destContent = JSON.stringify(result, undefined, 2);
        		grunt.file.write(destPath, destContent);
			});
		});
	});
};
