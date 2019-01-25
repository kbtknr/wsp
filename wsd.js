#!/usr/bin/env node

const program = require('commander');
// const fs = require('fs-extra')
// const path = require('path');
// const globby = require('globby');
// const { createClientConfig, createServerConfig } = require('./webpack');

program
  .version('1.0.0');

program
  .command('build <site-config>')
  .description('build site')
  .option('-d, --destination <value>', 'Destination directory')
  .action(function(siteConfig, options) {
    console.log('build', siteConfig, options);
  });

program
  .command('start <site-config>')
  .description('start site')
  .option('-D, --debug', 'Debug mode')
  .action(function(siteConfig, options) {
    console.log('start', siteConfig, options);
  });

program.parse(process.argv);
