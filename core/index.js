const cli = require('./app')

// Some commands may destroy the global reference to
// `console.log`, so we make sure we have one just in
// case.
const echo = console.log

Promise.resolve(cli.start())
  .then(output => {
    if (output) echo(output)
  })
  .catch(err => {
    if (err && global.debugMode) echo(err)

    process.exit(1)
  })
