'use strict'

const colors = require('colors')
const fsHelpers = require('./../../../lib/fs')
const inquirer = require('inquirer')
const npm = require('./../../../lib/npm')
const path = require('path')
const registry = require('./../../../lib/registry')
const semverRangeCompare = require('semver-compare-range')
const setup = require('./setup')
const shell = require('./../../../lib/shell')

function install ({
  datastore,
  directory,
  version
}) {
  const directoryFullPath = path.resolve(process.cwd(), directory)

  return registry.downloadBoilerplate({
    product: 'api',
    target: directory,
    version
  }).then(launchCommand => {
    return shell.run(
      shell.command(
        'npm install',
        `Installing DADI API (${version})`,
        directoryFullPath
      )
    ).then(out => {
      if (datastore) {
        return shell.run(
          shell.command(
            `npm install ${datastore} --save`,
            `Installing the '${datastore}' database connector`,
            directoryFullPath
          )
        )
      }

      return out
    }).then(out => {
      return `\nAll done! Run the following command to launch your new instance of DADI API:\n\n${colors.bold(launchCommand)}\n`
    })
  })
}

module.exports = args => {
  const directory = args._[2] || '.'

  return fsHelpers.warnIfDirectoryIsNotEmpty({
    directory
  }).then(() => {
    const versionMessage = shell.showSpinner('Checking the available versions of DADI API')

    return registry.getBoilerplateVersions('api').then(versions => {
      const version = args.version || versions[versions.length - 1]

      if (!versions.includes(version)) {
        versionMessage.fail(`${colors.bold(version)} is not a valid version. Available versions: ${versions.join(', ')}`)

        return Promise.reject(new Error('INVALID_VERSION'))
      }

      versionMessage.succeed()

      let datastoreQueue

      // We only ask about database connectors for versions >= 3.x
      if (semverRangeCompare(version, '3.x') >= 0) {
        if (args.database) {
          datastoreQueue = Array.isArray(args.database)
            ? args.database[0]
            : args.database
        } else {
          const npmMessage = shell.showSpinner('Pulling the list of available database connectors from NPM')

          datastoreQueue = npm.search({
            filter: result => {
              return npm.filters.hasKeyword(result, 'dadi-api-connector') &&
                npm.filters.isTrusted(result)
            },
            text: 'dadi-api-connector'
          }).then(response => {
            npmMessage.succeed()

            const choices = response.map(item => {
              return {
                name: `${item.package.name} — ${item.package.description}`,
                short: item.package.name,
                value: item.package.name
              }
            })

            const questions = [
              {
                type: 'list',
                name: 'connector',
                message: 'Which database engine would you like to install?',
                choices
              }
            ]

            return inquirer
              .prompt(questions)
              .then(answers => answers.connector)
          }).catch(err => { // eslint-disable-line handle-callback-err
            npmMessage.fail('Could not connect to NPM registry. Are you connected to the Internet?')

            return Promise.reject(err)
          })
        }
      }

      return Promise.resolve(datastoreQueue).then(datastore => {
        return install({
          datastore,
          directory,
          version
        }).then(output => {
          if (args['skip-setup']) {
            return output
          }

          return setup.run({
            baseDirectory: directory,
            datastore
          }).then(() => output)
        })
      })
    })
  })
}

module.exports.description = 'Creates a new instance of DADI API'
module.exports.parameters = {
  inline: [
    {
      key: 'directory',
      description: 'the name of the directory where DADI API will be installed'
    }
  ],
  flags: [
    {
      key: 'version',
      description: 'the version of API to install (defaults to latest)'
    }
  ]
}
