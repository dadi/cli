'use strict'

const fs = require('fs')
const fsHelpers = require('./fs')
const path = require('path')

const ConfigHelpers = function () {}

ConfigHelpers.prototype._getConfigFilePath = function ({
  environment,
  sample = false,
  timestamp = false
}) {
  let filePath = `config/config.${environment}.json`

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
  baseDirectory = '.'
}) {
  const configFilePath = path.join(
    process.cwd(),
    baseDirectory,
    this._getConfigFilePath({
      environment: 'development',
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
      filePath: 'config.js'
    }).then(config => {
      if (createdTemporaryConfigFile) {
        return new Promise((resolve, reject) => {
          fs.unlink(configFilePath, err => {
            return resolve(err)
          })
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
  environment
}) {
  const configFilePath = path.join(
    process.cwd(),
    baseDirectory,
    this._getConfigFilePath({
      environment
    })
  )

  return fsHelpers
    .fileExists(configFilePath)
    .then(configExists => {
      const backupFilePath = path.join(
        process.cwd(),
        baseDirectory,
        this._getConfigFilePath({
          environment,
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
    })
}

module.exports = new ConfigHelpers()
