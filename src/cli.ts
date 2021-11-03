#!/usr/bin/env node

import {program} from 'commander'
import {templetize} from './index'

let pkg = require("../package.json");
program.version(pkg.version)
    .command('templetize')
    .usage('[options]')
    .option('-i, --source <source>', 'Source project directory')
    .option('-o, --target <target>', 'Target directory')
    .option('-c, --config <config>', 'Configuration for the transition')
    .action(templetize)
    .parse(process.argv).opts()
