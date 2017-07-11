#!/usr/bin/env node

const cli = require('../index.js')

Promise.resolve(cli.start()).then(console.log)
