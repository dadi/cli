'use strict'

const fs = require('fs')
const latestVersion = require('latest-version')
const path = require('path')
const pkg = require('./../package.json')
const semverRangeCompare = require('semver-compare-range')

const CACHE_PATH = path.join(
  __dirname,
  '/../',
  'latest-version.json'
)
const MAX_POLL_INTERVAL = 10

const UpdateCheck = function (appName) {
  this.appName = appName
  this.queue = null
}

UpdateCheck.prototype.getFromRemote = function (currentTimestamp) {
  return latestVersion(this.appName)
}

UpdateCheck.prototype.readCache = function (rejectOnFailure) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime()

    try {
      fs.readFile(CACHE_PATH, (err, data) => {
        if (err) return reject(err)

        const parsedData = JSON.parse(data)

        return resolve({
          timestamp,
          version: parsedData.version
        })
      })
    } catch (err) {
      return reject(err)
    }
  }).catch(err => {
    if (!rejectOnFailure) {
      return Promise.resolve(null)
    }

    return Promise.reject(err)
  })
}

UpdateCheck.prototype.start = function () {
  const currentTimestamp = new Date().getTime()

  return this.readCache().then(cache => {
    if (cache) {
      if ((cache.timestamp + MAX_POLL_INTERVAL) <= currentTimestamp) {
        this.queue = this.getFromRemote(currentTimestamp).then(remoteVersion => {
          if (semverRangeCompare(remoteVersion, cache.version) > 0) {
            return this.writeCache(currentTimestamp, remoteVersion)
          }
        })
      }

      if (semverRangeCompare(cache.version, pkg.version) > 0) {
        return {
          current: pkg.version,
          new: cache.version
        }
      }
    } else {
      this.queue = this.getFromRemote(currentTimestamp).then(remoteVersion => {
        return this.writeCache(currentTimestamp, remoteVersion)
      })
    }
  })
}

UpdateCheck.prototype.writeCache = function (timestamp, version) {
  return new Promise((resolve, reject) => {
    const payload = {
      timestamp,
      version
    }

    fs.writeFile(CACHE_PATH, JSON.stringify(payload), err => {
      if (err) return reject(err)

      return resolve()
    })
  })
}

module.exports = new UpdateCheck('@dadi/cli')
