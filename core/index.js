const cli = require('./app')

Promise.resolve(cli.start())
  .then(output => {
    if (output) console.log(output)
  })
  .catch(err => {
    if (err && global.debugMode) console.log(err)
  })
