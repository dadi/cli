'use strict'

const fetch = require('node-fetch')
const fs = require('fs-extra')
const path = require('path')
const request = require('request-promise-native')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./shell')
const unzip = require('decompress')

const RegistryHelpers = function () {
  this.apiUrl = 'https://dadi.github.io/registry'
  this.registryUrl = 'https://dadi.github.io/registry'
  this.repoUrl = 'git@github.com:dadi/registry.git'
}

RegistryHelpers.prototype.clonePath = function ({
  remotePath,
  repo = this.repoUrl,
  targetDirectory
}) {
  const command = `rm -rf ${targetDirectory}/_temp && mkdir -p ${targetDirectory}/_temp && \
cd ${targetDirectory}/_temp && git init && git remote add -f origin ${repo} && \
git config core.sparseCheckout true && echo "${remotePath}" >> .git/info/sparse-checkout && \
git pull origin master && mv ${remotePath}/* ../ && cd .. && rm -rf _temp`

  return command
}

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
    file: `${product}/boilerplate/${version}.zip`,
    progressCallback: percentage => {
      spinner.text = `${spinnerMessage} (${percentage}%)`
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
    spinner.fail()

    return err
  })
}

RegistryHelpers.prototype.downloadFile = function ({
  file,
  progressCallback,
  target: targetDirectory = process.cwd(),
  unzip: shouldUnzip = true
}) {
  const binaryUrl = `${this.registryUrl}/${file}`
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
    uri: this.apiUrl + '/versions.json'
  }).then(response => {
    if (!response[product]) return []

    return response[product].sort(semverRangeCompare)
  })
}

module.exports = new RegistryHelpers()
