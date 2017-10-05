'use strict'

const exec = require('child_process').exec
const ora = require('ora')

const ShellHelpers = function () {}

ShellHelpers.prototype.command = function (command, message, cwd) {
  return {
    command,
    cwd,
    message
  }
}

ShellHelpers.prototype.killProcess = function (delay = 1000) {
  setTimeout(() => {
    process.exit(0)
  }, delay)
}

ShellHelpers.prototype.run = function (commandObj, options) {
  options = options || {}

  const command = typeof commandObj === 'string'
    ? commandObj
    : commandObj.command

  let execOptions = {}
  let spinner

  if (commandObj.cwd) {
    execOptions.cwd = commandObj.cwd
  }

  if (commandObj.message && !options.silent) {
    spinner = ora(commandObj.message).start()
  }

  return new Promise((resolve, reject) => {
    exec(command, execOptions, (error, stdout, stderr) => {
      if (global.debugMode) {
        console.log(stderr)
        console.log(stdout)
      }

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

ShellHelpers.prototype.showSpinner = function (text, mode = 'start') {
  return ora(text)[mode]()
}

ShellHelpers.prototype.showText = function (text) {
  console.log(text)
}

module.exports = new ShellHelpers()
