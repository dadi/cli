'use strict'

const exec = require('child_process').exec
const ora = require('ora')

const ShellHelpers = function () {}

ShellHelpers.prototype.command = function (command, message) {
  return {
    command,
    message
  }
}

ShellHelpers.prototype.run = function (commandObj, options) {
  options = options || {}

  const command = typeof commandObj === 'string'
    ? commandObj
    : commandObj.command

  let spinner

  if (commandObj.message && !options.silent) {
    spinner = ora(commandObj.message).start()
  }

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        spinner && spinner.fail()

        return reject(error)
      }

      spinner && spinner.succeed()

      resolve(stdout)
    })
  })
}

ShellHelpers.prototype.runAll = function (sequence, options) {
  let commands = Promise.resolve(true)

  sequence.forEach(command => {
    commands = commands.then(() => this.run(command, options))
  })

  return Promise.resolve(commands)
}

ShellHelpers.prototype.showSpinner = function (text) {
  return ora(text).start()
}

module.exports = new ShellHelpers()
