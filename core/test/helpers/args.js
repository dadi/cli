const minimist = require('minimist')

const getArgsForCommand = command => {
  return minimist(command.split(' ').slice(1))
}

module.exports.getArgsForCommand = getArgsForCommand
