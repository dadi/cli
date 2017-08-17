'use strict'

const colors = require('colors')
const git = require('./../../../lib/git')
const inquirer = require('inquirer')
const npm = require('./../../../lib/npm')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../lib/shell')

function installWeb ({
  directory,
  engines,
  version
}) {
  let command = []

  command.push(
    shell.command(
      git.clonePath({
        remotePath: `web/boilerplate/${version}`,
        targetDirectory: directory
      }),
      `Cloning boilerplate repository`
    )
  )

  command.push(
    shell.command(
      `cd ${directory} && npm install`,
      `Installing DADI Web (${version})`
    )
  )

  if (engines) {
    engines.forEach(engine => {
      command.push(
        shell.command(
          `cd ${directory} && npm install ${engine} --save`,
          `Installing engine: ${engine}`
        )
      )
    })

    const enginesBlock = JSON.stringify({engines})
      .replace(new RegExp('/', 'g'), '\\/')

    command.push(
      shell.command(
        `sed -i "" -e 's/\\/\\*@requires@\\*\\//${enginesBlock}/g' ${directory}/server.js`,
        'Adding engines to bootstrap file'
      )
    )
  }

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
    return `\nAll done! Run the following command to launch your new instance of DADI Web:\n\n${colors.bold(launchCommand)}\n`
  })
}

module.exports = args => {
  const directory = args._[2] || '.'
  const versionMessage = shell.showSpinner('Checking the available versions of DADI Web')

  return git.getBoilerplateVersions('web').then(versions => {
    const version = args.version || versions[versions.length - 1]

    if (!versions.includes(version)) {
      versionMessage.fail(`${colors.bold(version)} is not a valid version. Available versions: ${versions.join(', ')}`)

      return Promise.reject(new Error('INVALID_VERSION'))
    }

    versionMessage.succeed()

    return version
  }).then(version => {
    let engines = Promise.resolve(null)
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
          npmMessage.fail('Could not connect to NPM registry. Are you connected to the internet?')
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
