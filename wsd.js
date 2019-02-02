#!/usr/bin/env node

const program = require('commander');
const start = require('./lib/start');
const build = require('./lib/build');
// const fs = require('fs-extra')
// const path = require('path');
// const globby = require('globby');
// const { createClientConfig, createServerConfig } = require('./webpack');

program
  .version('1.0.0');

program
  .command('start <site-config>')
  .description('start site')
  .option('-D, --debug', 'Debug mode')
  .action(function(siteConfig, options) {
    start(siteConfig).catch((err) => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program
  .command('build <site-config>')
  .description('build site')
  .option('-d, --destination <value>', 'Destination directory')
  .action(function(siteConfig, options) {
    build(siteConfig).catch((err) => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program.parse(process.argv);
