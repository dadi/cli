'use strict'

const constants = require('./constants')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const semverRangeCompare = require('semver-compare-range')

const MAX_POLL_INTERVAL = 10

const UpdateCheck = function (options) {
  this.cachePath = options.cachePath
  this.queue = null
}

UpdateCheck.prototype.checkForUpdates = function () {
  return this.readCache().then(cache => {
    if (!cache.timestamp || ((cache.timestamp + MAX_POLL_INTERVAL) <= Date.now())) {
      return this.getLatestVersion().then(remoteVersion => {
        if (!cache.version || (semverRangeCompare(remoteVersion, cache.version) > 0)) {
          return remoteVersion
        } else {
          this.writeCache(remoteVersion)
        }
      })
    }

    return null
  }).catch(err => {
    return this.getLatestVersion()
  })
}

UpdateCheck.prototype.getLatestVersion = function () {
  return fetch(constants.registryUrl + '/v1/cli.json').then(res => {
    return res.json()
  }).then(res => {
    return res.version
  })
}

UpdateCheck.prototype.installationHasFinished = function (version) {
  return this.writeCache(version)
}

UpdateCheck.prototype.readCache = function (rejectOnFailure) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime()

    fs.readFile(this.cachePath, (err, data) => {
      if (err) return reject(err)

      const parsedData = JSON.parse(data)

      return resolve(parsedData)
    })
  })
}

UpdateCheck.prototype.writeCache = function (version) {
  return new Promise((resolve, reject) => {
    const payload = {
      timestamp: Date.now(),
      version
    }

    fs.writeFile(this.cachePath, JSON.stringify(payload), err => {
      if (err) return reject(err)

      return resolve()
    })
  })
}

module.exports = UpdateCheck
