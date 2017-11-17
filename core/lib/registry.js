'use strict'

const constants = require('./../../shared/constants')
const fetch = require('node-fetch')
const fs = require('fs-extra')
const path = require('path')
const request = require('request-promise-native')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./shell')
const unzip = require('decompress')

const RegistryHelpers = function () {}

RegistryHelpers.prototype.downloadBoilerplate = function ({
  product,
  target,
  version
}) {
  const targetDirectory = path.resolve(
    process.cwd(),
    target
  )
  const payloadDirectory = path.join(targetDirectory, version)
  const spinnerMessage = 'Downloading boilerplate'
  const spinner = shell.showSpinner(spinnerMessage)
  const launchCommand = (target !== '.'
      ? `cd ${target} && `
      : '') + 'npm start'

  return this.downloadFile({
    file: `boilerplates/${product}/${version}.zip`,
    progressCallback: percentage => {
      if (!isNaN(percentage)) {
        spinner.text = `${spinnerMessage} (${percentage}%)`
      }
    },
    target: targetDirectory
  }).then(res => {
    return fs.readdir(payloadDirectory)
  }).then(items => {
    const queue = items.map(item => {
      return fs.move(
        path.join(payloadDirectory, item),
        path.join(targetDirectory, item)
      )
    })

    return Promise.all(queue)
  }).then(() => {
    return fs.remove(payloadDirectory)
  }).then(() => {
    spinner.succeed()

    return launchCommand
  }).catch(err => {
    spinner.fail('The connection to the DADI registry has failed. Are you connected to the Internet?')

    return Promise.reject(err)
  })
}

RegistryHelpers.prototype.downloadFile = function ({
  file,
  progressCallback,
  target: targetDirectory = process.cwd(),
  unzip: shouldUnzip = true
}) {
  const binaryUrl = `${constants.registryUrl}/${file}`
  const fileName = binaryUrl.split('/').pop()
  const target = path.join(
    targetDirectory,
    fileName
  )

  let progress = 0

  const registerProgress = newProgress => {
    if (newProgress === progress) return

    progress = newProgress

    if (typeof progressCallback === 'function') {
      progressCallback(progress)
    }
  }

  return fs.ensureDir(targetDirectory).then(() => {
    registerProgress(0)

    return fetch(binaryUrl, {
      compress: false
    })
  }).then(res => {
    const size = parseInt(res.headers.get('content-length'), 10)
    const writer = fs.createWriteStream(target)

    let downloaded = 0

    return new Promise((resolve, reject) => {
      res.body
        .on('error', reject)
        .on('data', chunk => {
          downloaded += chunk.length

          registerProgress(
            Math.round((downloaded / size) * 100)
          )
        })

      res.body.pipe(writer)

      writer
        .on('error', reject)
        .on('close', res => {
          if (shouldUnzip && path.extname(fileName) === '.zip') {
            unzip(target, targetDirectory).then(() => {
              return fs.remove(target)
            }).then(() => resolve(target))
          } else {
            return resolve(target)
          }
        })
        .on('end', () => {
          registerProgress(100)
        })
    })
  })
}

RegistryHelpers.prototype.getBoilerplateVersions = function (product) {
  return request({
    json: true,
    uri: constants.apiUrl + '/v1/boilerplates.json'
  }).then(response => {
    if (!response[product]) return []

    return response[product].sort(semverRangeCompare)
  })
}

module.exports = new RegistryHelpers()
