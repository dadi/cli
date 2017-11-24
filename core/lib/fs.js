'use strict'

const colors = require('colors')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const path = require('path')
const shell = require('./shell')

const FsHelpers = function () {}

FsHelpers.prototype.cd = function (directory) {
  process.chdir(
    path.resolve(
      process.cwd(),
      directory
    )
  )
}

FsHelpers.prototype.fileExists = function (file) {
  return fs.stat(path.resolve(process.cwd(), file))
    .then(stats => true)
    .catch(err => false) // eslint-disable-line handle-callback-err
}

FsHelpers.prototype.loadApp = function (name, {
  baseDirectory = '.',
  displayError = true
} = {}) {
  return new Promise((resolve, reject) => {
    try {
      const app = require(
        path.resolve(
          process.cwd(),
          baseDirectory,
          'node_modules',
          name
        )
      )

      const pkg = require(
        path.resolve(
          process.cwd(),
          baseDirectory,
          'node_modules',
          name,
          'package.json'
        )
      )

      return resolve({
        module: app,
        pkg
      })
    } catch (err) {
      if (displayError) {
        shell.showSpinner(
          `This directory does not seem to contain an installation of ${colors.bold(name)}. Are you running the command from the right location?`,
          'fail'
        )
      }

      return reject(new Error('ERR_LOADING_APP'))
    }
  })
}

FsHelpers.prototype.loadAppFile = function (name, {
  baseDirectory = '.',
  filePath
} = {}) {
  return new Promise((resolve, reject) => {
    try {
      const file = require(
        path.resolve(
          process.cwd(),
          baseDirectory,
          'node_modules',
          name,
          filePath
        )
      )

      return resolve(file)
    } catch (err) {
      return reject(err)
    }
  })
}

FsHelpers.prototype.readFile = function (filePath, {
  baseDirectory = '.'
} = {}) {
  return fs.readFile(
    path.resolve(
      process.cwd(),
      baseDirectory,
      filePath
    ),
    'utf8'
  )
}

FsHelpers.prototype.warnIfDirectoryIsNotEmpty = function ({
  directory,
  message
}) {
  message = message ||
    `The target directory (${path.resolve(directory)}) is not empty. Would you like to proceed?`

  const shouldAbort = fs.readdir(directory)
    .then(files => {
      if (files.length === 0) {
        return false
      }

      const question = {
        default: false,
        type: 'confirm',
        name: 'confirm',
        message
      }

      return inquirer
        .prompt([question])
        .then(answers => {
          if (answers.confirm) {
            return false
          }

          return Promise.reject(new Error('Command aborted'))
        })
    })
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false
      }

      return Promise.reject(err)
    })

  return shouldAbort
}

module.exports = new FsHelpers()
