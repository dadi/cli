#!/usr/bin/env node

const cli = require('../index.js')

Promise.resolve(cli.start())
  .then(output => {
    if (output) console.log(output)
  })
  .catch(err => {
    if (err) console.log(err)
  })
