/*
 * grunt-concat
 * https://github.com/eastkiki/grunt-concat
 *
 * Copyright (c) 2012 Dong-il Kim
 * Licensed under the MIT license.
 */
var request = require("request"),
    fs = require("fs");

module.exports = function(grunt) {
    'use strict';
    // Please see the grunt documentation for more information regarding task and
    // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask('concat', 'Concatenate files with remote supports.', function() {
        var done = this.async();

        function isRemoteFile(filename) {
            return (/(?:file|https?):\/\/([a-z0-9\-]+\.)+[a-z0-9]{2,4}.*$/).test(filename);
        }
        function readRemoteFile(filename, cb) {
            request(filename, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    cb(null, body);
                } else {
                    cb({e:err,filepath:filename});
                }
            });
        }
        function readLocalFile(filename, cb) {
            fs.readFile(filename, "utf-8", function (err, data) {
                if (err) {
                    cb({e:err,filepath:filename});
                } else {
                    cb(null, data);
                }
            });
        }

        var fnList = [];
        this.file.src.forEach(function (filename, index) {
            if (isRemoteFile(filename)) {
                fnList.push(function(cb){
                    readRemoteFile(filename, cb);
                });
            } else {
                var files = grunt.file.expandFiles(filename);
                files.forEach(function (f, i) {
                    fnList.push(function(cb){
                        readLocalFile(f, cb);
                    });
                });
            }
        });

        var self = this;
        grunt.utils.async.parallel(fnList, function (err, results) {
            if (err) {
                done(false);
                grunt.verbose.error();
                throw grunt.task.taskError('Unable to read "' + err.filepath +
                                            '" file (Error code: ' + err.e.code + ').', err.e);
            }

            var src = results.join(self.data.separator || "");
            grunt.file.write(self.file.dest, src);

            // Fail task if errors were logged.
            if (self.errorCount) {
                done(false);
                return false;
            }

            // Otherwise, print a success message.
            grunt.log.writeln('File "' + self.file.dest + '" created.');
            done(true);
        });
    });
};
