module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            banner: "/*\n" +
            " *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
            " *  <%= pkg.description %>\n" +
            " *  <%= pkg.homepage %>\n" +
            " *\n" +
            " *  Made by <%= pkg.author.name %>\n" +
            " *  Under <%= pkg.licenses[0].type %> License (<%= pkg.licenses[0].url %>)\n" +
            " */\n"
        },
        bower: {
            dev: {
                dest: 'dist/js/lib/'
            }
        },
        concat: {
            dist: {
                src: ["src/js/jquery.somodal.js"],
                dest: "dist/js/jquery.somodal.js"
            }
        },
        copy: {
            css: {
              cwd: 'src/css',
              src: '**/*',
              dest: 'dist/css',
              expand: true
            }
        },
        cssmin: {
            minify: {
              src: "dist/css/jquery.somodal.css",
              dest: 'dist/css/jquery.somodal.min.css'
            }
        },
        uglify: {
            dep: {
                files: [
                { src: "dist/js/lib/jquery.js", dest: "dist/js/lib/jquery.min.js" },
                { src: "dist/js/lib/jquery.transit.js", dest: "dist/js/lib/jquery.transit.min.js" },
                ],
            },
            build: {
                files: [
                { src: "dist/js/jquery.somodal.js", dest: "dist/js/jquery.somodal.min.js" },
                ],
            }
        },
        jquerymanifest: {
            options: {
                source: grunt.file.readJSON("package.json")
            }
        },
        watch: {
            scripts: {
              files: 'src/**/*.js',
              tasks: ['concat:dist', 'uglify:build']
            },
            styles: {
              files: 'css/**/*.css',
              tasks: ['copy:css', 'cssmin']
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-jquerymanifest");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-bower');

    grunt.registerTask("default", ["concat", "bower", "copy", "cssmin", "uglify", "jquerymanifest"]);
};