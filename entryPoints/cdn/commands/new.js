'use strict'

const colors = require('colors')
const fsHelpers = require('./../../../lib/fs')
const path = require('path')
const registry = require('./../../../lib/registry')
const setup = require('./setup')
const shell = require('./../../../lib/shell')

function install ({
  directory,
  version
}) {
  const directoryFullPath = path.resolve(process.cwd(), directory)

  return registry.downloadBoilerplate({
    product: 'cdn',
    target: directory,
    version
  }).then(launchCommand => {
    return shell.run(
      shell.command(
        'npm install',
        `Installing DADI CDN (${version})`,
        directoryFullPath
      )
    ).then(out => {
      return `\nAll done! Run the following command to launch your new instance of DADI CDN:\n\n${colors.bold(launchCommand)}\n`
    })
  })
}

module.exports = args => {
  const directory = args._[2] || '.'

  return fsHelpers.warnIfDirectoryIsNotEmpty({
    directory
  }).then(() => {
    const versionMessage = shell.showSpinner('Checking the available versions of DADI CDN')

    return registry.getBoilerplateVersions('cdn').then(versions => {
      const version = args.version || versions[versions.length - 1]

      if (!versions.includes(version)) {
        versionMessage.fail(
          `${colors.bold(version)} is not a valid version. Available versions: ${versions.join(', ')}`
        )

        return Promise.reject(new Error('INVALID_VERSION'))
      }

      versionMessage.succeed()

      return version
    }).then(version => {
      return install({
        directory,
        version
      })
    }).then(output => {
      if (args['skip-setup']) {
        return output
      }

      return setup.run(directory).then(() => output)
    })
  })
}

module.exports.description = 'Creates a new instance of DADI CDN'
module.exports.parameters = {
  inline: [
    {
      key: 'name',
      description: 'the name of the DADI CDN instance'
    }
  ],
  flags: [
    {
      key: 'skip-setup',
      description: 'skips the interactive setup guide'
    },
    {
      key: 'version',
      description: 'the version of CDN to install (defaults to latest)'
    }
  ]
}
