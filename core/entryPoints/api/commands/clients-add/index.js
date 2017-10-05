'use strict'

const colors = require('colors')
const fsHelpers = require('./../../../../lib/fs')
const inquirer = require('inquirer')
const mockRequire = require('mock-require')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../../lib/shell')

const createClient = ({clientId, message, secret, type}) => {
  // Mocking these modules so that API doesn't polute stdout.
  mockRequire('console-stamp', () => {})
  mockRequire('bunyan', {
    createLogger: () => ({
      addStream: () => {}
    }),
    resolveLevel: () => {}
  })
  console.log = function () {}

  return fsHelpers.loadApp('@dadi/api').then(app => {
    // Deciding which syntax to use based on the version of API.
    let createRecordsFn = semverRangeCompare(app.pkg.version, '3.0.0') < 0
      ? require('./create-records-api-v1-v2')
      : require('./create-records-api-v3')

    return createRecordsFn({
      apiConfig: app.module.Config,
      apiConnection: app.module.Connection,
      clientId,
      secret,
      type
    })
  }).then(docs => {
    if (message) {
      message.succeed(`Created client with ID ${colors.bold(clientId)} and type ${colors.bold(type)}`)
    }
  }).catch(err => {
    switch (err && err.message) {
      case 'ERR_LOADING_APP':
        if (message) {
          message.fail('The current directory does not seem to contain a working DADI API installation')
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
      message: 'What is the client ID?'
    },
    {
      type: 'input',
      name: 'secret',
      message: 'What is the secret?'
    },
    {
      type: 'list',
      name: 'type',
      message: 'What is the secret?',
      choices: ['user', 'admin']
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
        message,
        secret: answers.secret,
        type: answers.type
      })
    })
  }
}

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
