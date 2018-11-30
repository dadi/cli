'use strict'

const mri = require('mri')
const args = mri(process.argv.slice(2))
const format = require('./lib/format')
const entryPoints = {
  api: require('./entryPoints/api'),
  cdn: require('./entryPoints/cdn'),
  web: require('./entryPoints/web')
}
const pkg = require('./package.json')

module.exports.start = () => {
  // Injecting an `id` property into each entry point
  Object.keys(entryPoints).forEach(entryPoint => {
    entryPoints[entryPoint].id = entryPoint
  })

  if (args.debug) {
    global.debugMode = true
  }

  if (args._[0] === 'help') {
    // Is this a valid entry point?
    if (args._[1] && entryPoints[args._[1]]) {
      // Is this a valid command?
      if (args._[2] && entryPoints[args._[1]].commands[args._[2]]) {
        return format.getCommandHelp(
          entryPoints[args._[1]],
          args._[2]
        )
      } else {
        return format.getEntryPointHelp(entryPoints[args._[1]], args._[2])
      }
    } else {
      return format.getGeneralHelp(entryPoints)
    }
  } else if (args.v || args.version || (args._[0] === 'update')) {
    return pkg.version
  } else if (args._[0] && entryPoints[args._[0]]) {
    if (typeof entryPoints[args._[0]].commands[args._[1]] === 'function') {
      return entryPoints[args._[0]].commands[args._[1]](args)
    } else {
      return format.getEntryPointHelp(entryPoints[args._[0]], args._[1])
    }
  } else {
    return format.getGeneralHelp(entryPoints, args._[0])
  }
}
