'use strict'

const request = require('request-promise-native')
const semverRangeCompare = require('semver-compare-range')

const RegistryHelpers = function () {
  this.apiUrl = 'https://dadi.github.io/registry'
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
