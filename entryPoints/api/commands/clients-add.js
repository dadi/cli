'use strict'

const colors = require('colors')
const inquirer = require('inquirer')
const mockRequire = require('mock-require')
const path = require('path')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../lib/shell')
const validate = require('./../../../lib/validate')

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

  let apiConfig
  let apiConnection
  let apiVersion

  try {
    apiConfig = require(
      path.resolve(
        process.cwd(),
        'node_modules',
        '@dadi',
        'api'
      )
    ).Config

    apiConnection = require(
      path.resolve(
        process.cwd(),
        'node_modules',
        '@dadi',
        'api'
      )
    ).Connection

    apiVersion = getApiVersion()
  } catch (err) {
    if (message) {
      message.fail('The current directory does not seem to contain a working DADI API installation')
    }

    return
  }

  // Deciding which syntax to use based on the version of API.
  let createRecordsFn = semverRangeCompare(apiVersion, '3.0.0') < 0
    ? createRecordsLegacy
    : createRecords

  return createRecordsFn({
    apiConfig,
    apiConnection,
    clientId,
    secret,
    type
  }).then(docs => {
    if (message) {
      message.succeed(`Created client with ID ${colors.bold(clientId)} and type ${colors.bold(type)}`)
    }
  }).catch(err => {
    switch (err && err.message) {
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

    console.log(err)
  })
}

// Routine for creating records in the client store for API versions >= 3.0.
const createRecords = ({
  apiConfig,
  apiConnection,
  clientId,
  secret,
  type
}) => {
  const clientCollectionName = apiConfig.get('auth.clientCollection')
  const dbOptions = {
    auth: true,
    database: apiConfig.get('auth.database'),
    collection: clientCollectionName
  }
  const connection = apiConnection(dbOptions, apiConfig.get('auth.datastore'))
  const payload = {
    clientId,
    secret,
    type
  }

  return new Promise((resolve, reject) => {
    let connected = false

    connection.on('connect', db => {
      if (connected) return

      connected = true

      db.find({
        clientId: clientId
      }, clientCollectionName, {}, getClientStoreSchema()).then(existingClients => {
        if (existingClients.results.length > 0) {
          killProcess()

          return reject(new Error('ID_EXISTS'))
        }

        db.insert(payload, clientCollectionName, getClientStoreSchema()).then(result => {
          killProcess()

          return resolve(result)
        }).catch((err) => {
          killProcess()

          return reject(err)
        })
      }).catch((err) => {
        killProcess()

        return reject(err)
      })
    })
  })
}

// Routine for creating records in the client store for legacy API versions (< 3.0).
const createRecordsLegacy = ({
  apiConfig,
  apiConnection,
  clientId,
  secret,
  type
}) => {
  const options = apiConfig.get('auth.database')
  options.auth = true

  const connection = apiConnection(options)
  const clientCollectionName = apiConfig.get('auth.clientCollection')
  const payload = {
    clientId,
    secret,
    type
  }

  return new Promise((resolve, reject) => {
    let connected = false

    connection.on('connect', db => {
      if (connected) return

      connected = true

      const existingClients = db.collection(clientCollectionName).find({
        clientId: clientId
      })

      existingClients.toArray((err, documents) => {
        if (err) {
          return reject(err)
        }

        if (documents.length > 0) {
          db.close()

          return reject(new Error('ID_EXISTS'))
        }

        db.collection(clientCollectionName).insert(payload, (err, docs) => {
          if (err) {
            return reject(err)
          }

          db.close()

          return resolve(docs)
        })
      })
    })
  })
}

const getApiVersion = () => {
  const packageJson = require(
    path.resolve(
      process.cwd(),
      'node_modules',
      '@dadi',
      'api',
      'package.json'
    )
  )

  return packageJson.version
}

const getClientStoreSchema = () => {
  return {
    fields: {
      token: {
        type: 'String',
        required: true
      },
      tokenExpire: {
        type: 'Number',
        required: true
      },
      created: {
        type: 'DateTime',
        required: true
      },
      value: {
        type: 'Object',
        required: false
      }
    },
    settings: {
      cache: false
    }
  }
}

const killProcess = () => {
  setTimeout(() => {
    process.exit(0)
  }, 1000)
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
  getApiVersion()

  if (args.id || args.secret) {
    const message = shell.showSpinner('Creating a new client')
    const invalidArgs = ['id', 'secret'].filter(arg => {
      return !validate.isStringLongerThan(args[arg], 0)
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
  inline: [
    {
      key: 'id',
      description: 'the client ID'
    }
  ],
  flags: [
    {
      key: 'secret',
      description: 'the client secret'
    }
  ]
}
