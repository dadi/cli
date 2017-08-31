'use strict'

const fs = require('fs')
const inquirer = require('inquirer')
const path = require('path')

const FsHelpers = function () {}

FsHelpers.prototype.warnIfDirectoryIsNotEmpty = function ({
  directory,
  message
}) {
  message = message ||
    `The target directory (${path.resolve(directory)}) is not empty. Would you like to proceed?`

  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (
        (err && err.code === 'ENOENT') ||
        files.length === 0
      ) {
        return resolve()
      }

      const question = {
        default: false,
        type: 'confirm',
        name: 'confirm',
        message
      }

      inquirer
        .prompt([question])
        .then(answers => {
          if (answers.confirm) {
            return resolve()
          }

          return reject(new Error())
        })
    })
  })
}

module.exports = new FsHelpers()
