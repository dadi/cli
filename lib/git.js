'use strict'

const GitHelpers = function () {}

GitHelpers.prototype.clonePath = function ({
  remotePath,
  repo = this.repoUrl,
  targetDirectory
}) {
  const command = `rm -rf _temp && mkdir _temp && cd _temp && \
git init && git remote add -f origin ${repo} && git config core.sparseCheckout true && \
echo "${remotePath}" >> .git/info/sparse-checkout && git pull origin master && \
mv ${remotePath} ../${targetDirectory} && cd .. && rm -rf _temp`

  return command
}

GitHelpers.prototype.repoUrl = 'git@github.com:dadi/resources.git'

module.exports = new GitHelpers()
