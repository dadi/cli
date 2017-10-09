'use strict'

const colors = require('colors')
const fs = require('fs-extra')
const fsHelpers = require('./../../../lib/fs')
const inquirer = require('inquirer')
const npm = require('./../../../lib/npm')
const path = require('path')
const registry = require('./../../../lib/registry')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../lib/shell')

function installWeb ({
  directory,
  engines,
  version
}) {
  const directoryFullPath = path.resolve(process.cwd(), directory)

  return registry.downloadBoilerplate({
    product: 'web',
    target: directory,
    version
  }).then(launchCommand => {
    let commands = [
      shell.command(
        'npm install',
        `Installing DADI Web (${version})`,
        directoryFullPath
      )
    ]
    let startScriptQueue

    if (engines) {
      // Because boilerplates include Dust pages, we sort of
      // need to guarantee that Dust is installed.
      if (!engines.includes('@dadi/web-dustjs')) {
        engines.push('@dadi/web-dustjs')
      }

      engines.forEach(engine => {
        commands.push(
          shell.command(
            `npm install ${engine} --save`,
            `Installing engine: ${engine}`,
            directoryFullPath
          )
        )
      })

      const startScriptPath = path.join(
        directoryFullPath,
        'server.js'
      )

      startScriptQueue = fs.readFile(startScriptPath, 'utf8')
        .then(startScript => {
          const enginesBlock = JSON.stringify({
            engines: engines.map(engine => `require('${engine}')`)
          }).replace(/"require\(([^)]*)\)"/g, 'require($1)')

          const startScriptReplaced = startScript
            .replace('/*@requires@*/', enginesBlock)

          return fs.writeFile(startScriptPath, startScriptReplaced)
        })
    }

    return shell.runAll(commands).then(out => {
      return Promise.resolve(startScriptQueue)
    }).then(() => {
      return `\nAll done! Run the following command to launch your new instance of DADI Web:\n\n${colors.bold(launchCommand)}\n`
    })
  })
}

module.exports = args => {
  const directory = args._[2] || '.'

  return fsHelpers.warnIfDirectoryIsNotEmpty({
    directory
  }).then(() => {
    const versionMessage = shell.showSpinner('Checking the available versions of DADI Web')

    return registry.getBoilerplateVersions('web').then(versions => {
      const version = args.version || versions[versions.length - 1]

      if (!versions.includes(version)) {
        versionMessage.fail(`${colors.bold(version)} is not a valid version. Available versions: ${versions.join(', ')}`)

        return Promise.reject(new Error('INVALID_VERSION'))
      }

      versionMessage.succeed()

      return version
    }).then(version => {
      let engines = null
      let questions = []

      // We only ask about template engines for versions >= 3.x
      if (semverRangeCompare(version, '3.x') >= 0) {
        if (args.engine) {
          engines = Array.isArray(args.engine)
            ? args.engine
            : [args.engine]
        } else {
          const filterFn = result => {
            return result.package &&
              result.package.keywords &&
              result.package.keywords.includes('web')
          }

          const npmMessage = shell.showSpinner('Pulling the list of available template engines from NPM')

          engines = npm.search({
            filter: filterFn,
            text: 'dadi web'
          }).then(response => {
            npmMessage.succeed()

            const engineChoices = response.map(item => {
              return {
                name: `${item.package.name} — ${item.package.description}`,
                short: item.package.name,
                value: item.package.name
              }
            })

            questions.push({
              type: 'checkbox',
              name: 'engines',
              message: 'Which template engines would you like to install?',
              choices: engineChoices
            })

            return inquirer
              .prompt(questions)
              .then(answers => answers.engines)
          }).catch(err => { // eslint-disable-line handle-callback-err
            npmMessage.fail('Could not connect to NPM registry. Are you connected to the Internet?')
          })
        }
      }

      return Promise.resolve(engines).then(engines => {
        return installWeb({
          directory,
          engines,
          version
        })
      })
    })
  })
}

module.exports.description = 'Creates a new instance of DADI Web'
module.exports.parameters = {
  inline: [
    {
      key: 'name',
      description: 'the name of the DADI Web instance'
    }
  ],
  flags: [
    {
      key: 'engine',
      description: 'name of a template engine interface NPM module (for versions >= 3.x)',
      multiple: true
    },
    {
      key: 'version',
      description: 'the version of Web to install (defaults to latest)'
    }
  ]
}
