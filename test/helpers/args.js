const minimist = require('minimist')

const getArgsForCommand = command => {
  return minimist(command.split(' '))
}

module.exports.getArgsForCommand = getArgsForCommand
