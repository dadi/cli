'use strict'

const configHelpers = require('./../../../lib/config')
const fsHelpers = require('./../../../lib/fs')
const path = require('path')
const Setup = require('./../../../lib/setup')

const steps = [
  {
    text: 'Let\'s start by configuring the web server that DADI Publish will run on.',
    questions: [
      {
        name: 'server.host',
        message: 'What IP address should the application be bount to?'
      },
      {
        name: 'server.port',
        message: 'What port number should the application be bount to?'
      }
    ]
  },

  {
    text: 'Time to connect Publish to an instance of DADI API.',
    questions: [
      {
        name: 'apis.0.host',
        message: 'What is the URL of the API instance?',
        default: 'https://api.somedomain.tech'
      },
      {
        name: 'apis.0.port',
        message: 'What port number is the API running on?',
        default: 443
      }
    ]
  },

  {
    text: 'Great! You have a basic configuration in place.',
    questions: [
      {
        type: 'list',
        name: 'env',
        message: 'Which environment does this config apply to?',
        choices: [
          {
            name: 'Development',
            value: 'development'
          },
          {
            name: 'Test/QA',
            value: 'test'
          },
          {
            name: 'Live/production',
            value: 'production'
          },
          {
            name: 'Other (custom)',
            value: 'custom'
          }
        ]
      },
      {
        condition: answers => answers.env === 'custom',
        name: 'env',
        message: 'What would you like the custom environment to be called?'
      }
    ]
  }
]

const launchSetup = () => {
  const app = '@dadi/publish'

  return configHelpers.getAppConfig({
    app,
    configPath: path.join('app', 'config.js'),
    fileName: 'config.development.json'
  }).then(config => {
    const setup = new Setup(steps, config.schema)

    setup.setTitle('DADI Publish setup')

    return setup.start()
  }).then(answers => {
    return configHelpers.saveAppConfig({
      app,
      config: answers,
      description: 'Publish configuration file',
      fileName: `config.${answers.env}.json`
    })
  })
}

module.exports = args => launchSetup()
module.exports.run = baseDirectory => {
  fsHelpers.cd(baseDirectory)

  return launchSetup()
}
module.exports.description = 'Launches an interactive setup wizard'
module.exports.parameters = {}
