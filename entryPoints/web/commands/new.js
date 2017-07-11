'use strict'

const colors = require('colors')
const inquirer = require('inquirer')
const npm = require('./../../../lib/npm')
const shell = require('./../../../lib/shell')

function installWeb ({
  directory,
  engines
}) {
  let command = []

  command.push(
    shell.command(
      `git clone git@github.com:dadi/web-boilerplate.git ${directory}`,
      `Cloning boilerplate repository`
    )
  )
  command.push(
    shell.command(``)
  )
  command.push(
    shell.command(
      `cd ${directory} && npm install`,
      'Installing DADI Web'
    )
  )

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

  command.push(
    shell.command(
      `rm -rf ${directory}/.git`,
      'Cleaning up'
    )
  )

  return shell.runAll(command).then(out => {
    return `\nAll done! Run ${colors.bold(`cd ${directory} && npm start`)} to launch your new instance of DADI Web.\n`
  })
}

module.exports = args => {
  const directory = args._[2] || '.'

  // Whenever we don't have enough information from the given parameters,
  // we'll add questions to this array. If it is populated with questions,
  // it means we go into "interactive mode" and wait for the user's input.
  // Otherwise, we proceed with the command immediately.
  let questions = []

  let engines

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

  return Promise.resolve(engines).then(engines => {
    return installWeb({
      directory,
      engines
    })
  })
}

module.exports.description = 'Creates a new instance of DADI Web'
module.exports.parameters = {
  inline: [
    {
      key: 'name',
      description: 'The name of the DADI Web instance'
    }
  ],
  flags: [
    {
      key: 'engine',
      description: 'Name of a template engine interface NPM module',
      multiple: true
    }
  ]
}
