'use strict'

const colors = require('colors')
const fs = require('fs')
const fsHelpers = require('./fs')
const path = require('path')
const shellHelpers = require('./shell')

const ConfigHelpers = function () {}

ConfigHelpers.prototype._getConfigFilePath = function ({
  fileName = 'config.development.json',
  sample = false,
  timestamp = false
}) {
  let filePath = path.join('config', fileName)

  if (sample) {
    filePath += '.sample'
  }

  if (timestamp) {
    filePath += `-${new Date().getTime()}`
  }

  return filePath
}

ConfigHelpers.prototype.getAppConfig = function ({
  app,
  baseDirectory = '.',
  configPath = 'config.js',
  fileName
}) {
  const configFilePath = path.join(
    process.cwd(),
    baseDirectory,
    this._getConfigFilePath({
      fileName,
      sample: false
    })
  )

  return fsHelpers.fileExists(configFilePath).then(configExists => {
    let queue = Promise.resolve(false)

    if (!configExists) {
      queue = new Promise((resolve, reject) => {
        fs.writeFile(configFilePath, '{}', err => {
          if (err) return reject(err)

          return resolve(true)
        })
      })
    }

    return queue
  }).then(createdTemporaryConfigFile => {
    return fsHelpers.loadAppFile(app, {
      baseDirectory,
      filePath: configPath
    }).then(config => {
      if (createdTemporaryConfigFile) {
        return new Promise((resolve, reject) => {
          fs.unlink(configFilePath, resolve)
        }).then(() => config)
      }

      return config
    }).then(config => ({
      schema: config.schema || config._def
    }))
  })
}

ConfigHelpers.prototype.saveAppConfig = function ({
  app,
  baseDirectory = '.',
  config,
  description = 'Configuration file',
  fileName,
  prefix,
  showSpinner = true
}) {
  const configFilePath = path.join(
    process.cwd(),
    baseDirectory,
    this._getConfigFilePath({
      fileName
    })
  )

  const spinner = showSpinner && shellHelpers.showSpinner('Writing files')

  return fsHelpers
    .fileExists(configFilePath)
    .then(configExists => {
      const backupFilePath = path.join(
        process.cwd(),
        baseDirectory,
        this._getConfigFilePath({
          fileName,
          timestamp: true
        })
      )

      if (configExists) {
        return new Promise((resolve, reject) => {
          fs.readFile(configFilePath, 'utf8', (err, data) => {
            if (err) return reject(err)

            fs.writeFile(backupFilePath, data, err => {
              if (err) return reject(err)

              return resolve(backupFilePath)
            })
          })
        })
      }

      return false
    }).then(backupFilePath => {
      const formattedConfig = JSON.stringify(config, null, 2)

      return new Promise((resolve, reject) => {
        fs.writeFile(configFilePath, formattedConfig, err => {
          if (err) return reject(err)

          return resolve(backupFilePath)
        })
      })
    }).then(backupFilePath => {
      let response = {
        path: configFilePath
      }

      if (backupFilePath) {
        response.backupPath = backupFilePath
      }

      return response
    }).then(result => {
      let message = `${description} written to ${colors.underline(result.path)}.`

      if (spinner) {
        if (result.backupPath) {
          spinner.warn(
            message +
            ` A file already existed at that location, so it was backed up to ${colors.underline(result.backupPath)}.`
          )
        } else {
          spinner.succeed(message)
        }
      }
    }).catch(err => {
      if (spinner) {
        spinner.fail('An unexpected error occurred when writing the configuration file.')
      }

      return Promise.reject(err)
    })
}

module.exports = new ConfigHelpers()
