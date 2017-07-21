'use strict'

const colors = require('colors')
const git = require('./../../../lib/git')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../lib/shell')

function install ({
  directory,
  version
}) {
  let command = []

  command.push(
    shell.command(
      git.clonePath({
        remotePath: `api/boilerplate/${version}`,
        targetDirectory: directory
      }),
      `Cloning boilerplate repository`
    )
  )

  command.push(
    shell.command(
      `cd ${directory} && npm install`,
      `Installing DADI API (${version})`
    )
  )

  command.push(
    shell.command(
      `rm -rf ${directory}/.git`,
      'Cleaning up'
    )
  )

  const launchCommand = (directory !== '.'
    ? `cd ${directory} && `
    : '') + 'npm start'

  return shell.runAll(command).then(out => {
    return `\nAll done! Run the following command to launch your new instance of DADI API:\n\n${colors.bold(launchCommand)}\n`
  })
}

module.exports = args => {
  const directory = args._[2] || '.'
  const versionMessage = shell.showSpinner('Checking the available versions of DADI API')

  return git.getBoilerplateVersions('api').then(versions => {
    const version = args.version || versions[versions.length - 1]

    if (!versions.includes(version)) {
      versionMessage.fail(`${colors.bold(version)} is not a valid version. Available versions: ${versions.join(', ')}`)

      return Promise.reject()
    }

    versionMessage.succeed()

    return version
  }).then(version => {
    return install({
      directory,
      version
    })
  })
}

module.exports.description = 'Creates a new instance of DADI API'
module.exports.parameters = {
  inline: [
    {
      key: 'name',
      description: 'the name of the DADI API instance'
    }
  ],
  flags: [
    {
      key: 'version',
      description: 'the version of API to install (defaults to latest)'
    }
  ]
}
