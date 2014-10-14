'use strict';

module.exports = function (grunt) {
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time at the end.
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.


    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
    ' Licensed MIT */\n',

    browserify: {
      dist: {
        files: {
          //'build/module.js': ['client/scripts/**/*.js', 'client/scripts/**/*.coffee'],
          //'dist/<%= pkg.name %>.js': ['src/**/*.coffee']
          'dist/<%= pkg.name %>.js': ['temp/**/*.coffee', 'src/common/factories/cordovaSQLite.js']
        },
        options: {
          transform: ['coffeeify']
        }
      }
    },

    coffee: {
      compileWithMaps: {
        options: {
          sourceMap: true,
          join: true
        },
        files: {
          'dist/<%= pkg.name %>.js': ['temp/**/*.coffee'] // concat then compile into single file
        }
      }
    },

    ngClassify: {
      app: {
        files: [
          {
            cwd: 'src',
            src: '**/*.coffee',
            dest: 'temp',
            expand: true
          }
        ],
        options: {
          appName: 'shared_view.module'
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['ngClassify', 'browserify']);
  //grunt.registerTask('default', ['ngClassify, coffee']);
};
