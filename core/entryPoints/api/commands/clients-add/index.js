'use strict'

const colors = require('colors')
const fsHelpers = require('./../../../../lib/fs')
const inquirer = require('inquirer')
// const mockRequire = require('mock-require')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../../lib/shell')
const utilHelpers = require('./../../../../lib/util')

const createClient = ({
  clientId,
  generated,
  message,
  secret,
  type
}) => {
  // Mocking these modules so that API doesn't polute stdout.
  // mockRequire('console-stamp', () => {})
  // mockRequire('bunyan', {
  //   createLogger: () => ({
  //     addStream: () => {}
  //   }),
  //   resolveLevel: () => {}
  // })
  console.log = function () {}

  const generatedSecret = secret === ''
    ? utilHelpers.generatePassword()
    : null

  return fsHelpers.loadApp('@dadi/api').then(app => {
    // Deciding which syntax to use based on the version of API.
    let createRecordsFn = semverRangeCompare(app.pkg.version, '3.0.0') < 0
      ? require('./create-records-api-v1-v2')
      : require('./create-records-api-v3')

    return createRecordsFn({
      apiConfig: app.module.Config,
      apiConnection: app.module.Connection,
      clientId,
      secret: generatedSecret || secret,
      type
    })
  }).then(docs => {
    if (message) {
      let messageString = `Created client with ID ${colors.bold(clientId)} and type ${colors.bold(type)}.`

      if (generatedSecret) {
        messageString += ` The secret we generated for you is ${colors.bold(generatedSecret)} – store it somewhere safe!`
      }

      message.succeed(messageString)
    }
  }).catch(err => {
    switch (err && err.message) {
      case 'ERR_LOADING_APP':
        if (message) {
          message.fail()
        }

        break

      case 'ID_EXISTS':
        if (message) {
          message.fail(`The ID ${colors.bold(clientId)} already exists`)
        }

        break

      default:
        if (message) {
          message.fail('Could not create client')
        }
    }
  })
}

const renderQuestions = () => {
  const questions = [
    {
      type: 'input',
      name: 'id',
      message: 'Enter the client ID'
    },
    {
      type: 'input',
      name: 'secret',
      message: 'Enter a strong secret (press Enter if you want us to generate one for you)'
    },
    {
      type: 'list',
      name: 'type',
      message: 'What type of access does the user require?',
      choices: [
        {
          name: 'Regular user',
          value: 'user'
        },
        {
          name: 'Administrator',
          value: 'admin'
        }
      ]
    }
  ]

  return inquirer
    .prompt(questions)
}

module.exports = args => {
  if (args.id || args.secret) {
    const message = shell.showSpinner('Creating a new client')
    const invalidArgs = ['id', 'secret'].filter(arg => {
      return (
        typeof args[arg] !== 'string' ||
        args[arg].length === 0
      )
    }).map(arg => colors.bold(arg))

    if (invalidArgs.length > 0) {
      message.fail(`${invalidArgs.join(' and ')} must have at least 1 character`)

      return
    }

    return createClient({
      clientId: args.id,
      message,
      secret: args.secret,
      type: args.type || 'user'
    })
  } else {
    return renderQuestions().then(answers => {
      const message = shell.showSpinner('Creating a new client')

      return createClient({
        clientId: answers.id,
        generated: answers._generated,
        message,
        secret: answers.secret,
        type: answers.type
      })
    })
  }
}

module.exports.createClient = createClient
module.exports.description = 'Creates a new client'
module.exports.parameters = {
  flags: [
    {
      key: 'id',
      description: 'the client ID'
    },
    {
      key: 'secret',
      description: 'the client secret'
    }
  ]
}
