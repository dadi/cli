'use strict'

const constants = require('./constants')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const pkgJson = require(
  path.join(__dirname, '..', 'package.json')
)
const semverRangeCompare = require('semver-compare-range')

// Cache TTL in milliseconds (one day)
const CACHE_TTL = 24 * 60 * 60 * 1000

const UpdateCheck = function (options) {
  this.cachePath = options.cachePath
  this.queue = null
}

UpdateCheck.prototype.checkForUpdates = function (options) {
  options = options || {}

  return new Promise((resolve, reject) => {
    this.readCache().then(cache => {
      if (
        options.forceUpdate ||
        !cache.timestamp ||
        (cache.timestamp + CACHE_TTL) <= Date.now()
      ) {
        return this.getLatestVersion().then(remoteVersions => {
          if (remoteVersions.wrapper !== pkgJson.version) {
            const error = new Error('@dadi/cli needs a manual update')

            error.code = 'WRAPPER_UPDATE'

            return reject(error)
          }

          if (!cache.version || (semverRangeCompare(remoteVersions.core, cache.version) > 0)) {
            return resolve(remoteVersions.core)
          }

          this.writeCache(remoteVersions.core)

          return resolve(null)
        }).catch(err => {
          // If we get here, it means the API call to the registry has failed.
          // To prevent CLI from working at all, we temporarily report that
          // there isn't a new version available.
          return resolve(null)
        })
      }
    }).catch(err => {
      return this.getLatestVersion().then(remoteVersions => resolve(remoteVersions.core))
    })
  })
}

UpdateCheck.prototype.getLatestVersion = function () {
  return fetch(constants.registryUrl + '/v1/cli.json').then(res => {
    return res.json()
  }).then(res => {
    return {
      core: res.versionCore,
      wrapper: res.versionWrapper
    }
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

      fs.chmodSync(this.cachePath, 0o777)

      return resolve()
    })
  })
}

module.exports = UpdateCheck
