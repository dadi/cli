'use strict'

const fs = require('fs')
const latestVersion = require('latest-version')
const path = require('path')
const semverRangeCompare = require('semver-compare-range')

const MAX_POLL_INTERVAL = 10

const UpdateCheck = function (options) {
  this.cachePath = options.cachePath
  this.queue = null
}

UpdateCheck.prototype.checkForUpdates = function (packageName) {
  return this.readCache().then(cache => {
    if ((cache.timestamp + MAX_POLL_INTERVAL) <= Date.now()) {
      return latestVersion(packageName).then(remoteVersion => {
        if (semverRangeCompare(remoteVersion, cache.version) > 0) {
          return remoteVersion
        }
      })
    }

    return null
  })
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
