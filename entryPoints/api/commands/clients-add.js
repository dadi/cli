'use strict'

const colors = require('colors')
const mockRequire = require('mock-require')
const path = require('path')
const shell = require('./../../../lib/shell')
const validate = require('./../../../lib/validate')

const createClient = ({clientId, message, secret, type}) => {
  let apiConfig
  let apiConnection

  mockRequire('console-stamp', () => {})
  console.log = function () {}

  try {
    apiConfig = require(path.resolve(
      process.cwd(),
      'node_modules',
      '@dadi',
      'api'
    )).Config

    apiConnection = require(path.resolve(
      process.cwd(),
      'node_modules',
      '@dadi',
      'api'
    )).Connection
  } catch (err) {
    console.log(err)
    if (message) {
      message.fail('The current directory does not seem to contain a DADI API installation')  
    }

    return
  }

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
        if (documents.length > 0) {
          if (message) {
            message.fail(`The ID ${colors.bold(clientId)} already exists`)
          }

          db.close()

          return reject()
        }

        db.collection(clientCollectionName).insert(payload, (err, docs) => {
          if (err) {
            if (message) {
              message.fail('Could not create client')
            }

            return reject(err)
          }

          if (message) {
            message.succeed(`Created client with ID ${colors.bold(clientId)} and type ${colors.bold(type)}`)
          }

          db.close()

          return resolve()
        })
      })
    })   
  })
}

module.exports = args => {
  const message = shell.showSpinner('Creating a new client')

  if (args.id || args.secret) {
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
