#!/usr/bin/env node

const program = require('commander');
const start = require('./lib/start');
const build = require('./lib/build');
const dev = require('./lib/dev');

program.version('1.0.0');

program
  .command('start <site-config>')
  .description('start site')
  .option('-D, --debug', 'Debug mode')
  .action(function(siteConfig, options) {
    const { debug, temp } = options;
    start({
      siteConfigPath: siteConfig,
      isDebug: debug,
    }).catch(err => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program
  .command('build <site-config>')
  .description('build site')
  .option('-D, --debug', 'Debug mode')
  .option('-d, --destination <value>', 'Destination directory')
  .option('-t, --temp <value>', 'Temporary directory')
  .action(function(siteConfig, options) {
    const { destination, temp, debug } = options;
    build({
      siteConfigPath: siteConfig,
      tmpDir: temp,
      outDir: destination,
      isDebug: debug,
    }).catch(err => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program
  .command('webapi <site-config>')
  .description('development server')
  .option('-s, --serve-port <value>', 'serve port')
  .option('-a, --webapi-port <value>', 'api port')
  .action(function(siteConfig, options) {
    dev({
      siteConfigPath: siteConfig,
      servePort: options.servePort || 8080,
      webapiPort: options.webapiPort || 3000,
    }).catch(err => {
      if (err) {
        console.error(err);
      }
      process.exit(1);
    });
  });
program.parse(process.argv);
