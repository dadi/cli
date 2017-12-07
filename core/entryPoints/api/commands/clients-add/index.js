'use strict'

const colors = require('colors')
const exec = require('child_process').exec
const fs = require('fs')
const fsHelpers = require('./../../../../lib/fs')
const inquirer = require('inquirer')
const path = require('path')
const semverRangeCompare = require('semver-compare-range')
const shell = require('./../../../../lib/shell')
const utilHelpers = require('./../../../../lib/util')

const createRecordsFnV1V2 = fs.readFileSync(
  path.join(__dirname, 'create-records-api-v1-v2.js'),
  'utf8'
)
const createRecordsFnV3 = fs.readFileSync(
  path.join(__dirname, 'create-records-api-v3.js'),
  'utf8'
)

const createClient = ({
  clientId,
  message,
  secret,
  type
}) => {
  const generatedSecret = secret === ''
    ? utilHelpers.generatePassword()
    : null

  return fsHelpers.loadAppFile('@dadi/api', {
    filePath: 'package.json'
  }).then(pkg => {
    // Deciding which syntax to use based on the version of API.
    let createRecordsFn = semverRangeCompare(pkg.version, '3.0.0') < 0
      ? createRecordsFnV1V2
      : createRecordsFnV3

    return new Promise((resolve, reject) => {
      exec(`node -e "${createRecordsFn}" ${clientId} ${generatedSecret || secret} ${type}`, (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr))
        }

        resolve(stdout)
      })
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
    if (message) {
      if (err && err.message.includes('ID_EXISTS')) {
        message.fail(`The ID ${colors.bold(clientId)} already exists`)

        return
      }

      message.fail('Could not create client')
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
