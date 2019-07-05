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

function getCreateRecordsFunction (packageVersion) {
  let fileName

  if (semverRangeCompare(packageVersion, '3.0.0') < 0) {
    fileName = 'create-records-api-v1.js'
  } else if (semverRangeCompare(packageVersion, '5.0.0') < 0) {
    fileName = 'create-records-api-v3.js'
  } else {
    fileName = 'create-records-api-v5.js'
  }

  return fs.readFileSync(path.join(__dirname, fileName), 'utf8')
}

const createClient = ({ clientId, message, secret, accessType }) => {
  const generatedSecret = secret === '' ? utilHelpers.generatePassword() : null

  return fsHelpers
    .loadAppFile('@dadi/api', {
      filePath: 'package.json'
    })
    .then(pkg => {
      const [version] = pkg.version.split('-')
      const createRecordsFn = getCreateRecordsFunction(version)

      return new Promise((resolve, reject) => {
        exec(
          `node -e "${createRecordsFn}" "${clientId}" "${generatedSecret ||
            secret}" ${accessType}`,
          (err, stdout, stderr) => {
            if (err) {
              return reject(new Error(stderr))
            }

            resolve(stdout)
          }
        )
      })
    })
    .then(client => {
      if (message) {
        let messageString = `Created client with ID ${colors.bold(
          clientId
        )} and access type ${colors.bold(accessType)}.`

        if (generatedSecret) {
          messageString += ` The secret we generated for you is ${colors.bold(
            generatedSecret
          )} – store it somewhere safe!`
        }

        message.succeed(messageString)
      }

      if (global.debugMode) {
        console.log(client)
      }
    })
    .catch(err => {
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
      message:
        'Enter a strong secret (press Enter if you want us to generate one for you)'
    },
    {
      type: 'list',
      name: 'accessType',
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

  return inquirer.prompt(questions)
}

module.exports = args => {
  if (args.id || args.secret) {
    const message = shell.showSpinner('Creating a new client')
    const invalidArgs = ['id', 'secret']
      .filter(arg => {
        return typeof args[arg] !== 'string' || args[arg].length === 0
      })
      .map(arg => colors.bold(arg))

    if (invalidArgs.length > 0) {
      message.fail(
        `${invalidArgs.join(' and ')} must have at least 1 character`
      )

      return
    }

    return createClient({
      clientId: args.id,
      message,
      secret: args.secret,
      accessType: args.accessType || 'user'
    })
  } else {
    return renderQuestions().then(answers => {
      const message = shell.showSpinner('Creating a new client')

      return createClient({
        clientId: answers.id,
        message,
        secret: answers.secret,
        accessType: answers.accessType
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
      description: 'the client ID',
      type: 'string'
    },
    {
      key: 'secret',
      description: 'the client secret',
      type: 'string'
    }
  ]
}
