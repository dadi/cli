'use strict'

const request = require('request-promise-native')
const semverRangeCompare = require('semver-compare-range')

const GitHelpers = function () {}

GitHelpers.prototype.apiUrl = 'https://dadi.github.io/resources'

GitHelpers.prototype.clonePath = function ({
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

GitHelpers.prototype.getBoilerplateVersions = function (product) {
  return request({
    json: true,
    uri: this.apiUrl + '/versions.json'
  }).then(response => {
    return response[product].sort(semverRangeCompare)
  })
}

GitHelpers.prototype.repoUrl = 'git@github.com:dadi/resources.git'

module.exports = new GitHelpers()
