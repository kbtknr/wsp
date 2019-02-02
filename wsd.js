#!/usr/bin/env node

const program = require('commander');
const start = require('./lib/start');
const build = require('./lib/build');

program
  .version('1.0.0');

program
  .command('start <site-config>')
  .description('start site')
  .option('-D, --debug', 'Debug mode')
  .option('-t, --temp <value>', 'Temporary directory')
  .action(function(siteConfig, options) {
    const {
      debug,
      temp
    } = options;
    start({
      siteConfigPath: siteConfig,
      tmpDir: temp,
      isDebug: debug
    }).catch((err) => {
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
  .option('-t, --temp <value>', 'Temporary directory')
  .action(function(siteConfig, options) {
    const {
      destination,
      temp,
    } = options;
    build({
      siteConfigPath: siteConfig,
      tmpDir: temp,
      outDir: destination,
      isDebug: true
    }).catch((err) => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program.parse(process.argv);
