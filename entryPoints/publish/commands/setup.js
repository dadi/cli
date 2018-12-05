'use strict'

const configHelpers = require('./../../../lib/config')
const fsHelpers = require('./../../../lib/fs')
const path = require('path')
const Setup = require('./../../../lib/setup')
const shellHelpers = require('./../../../lib/shell')

const steps = [
  {
    text: 'Let\'s start by configuring the web server that DADI Publish will run on.',
    questions: [
      {
        name: 'server.host',
        message: 'What IP address should the application be bound to?'
      },
      {
        name: 'server.port',
        message: 'What port number should the application be bound to?'
      },
      {
        name: 'publicUrl.host',
        message: 'What domain name will the application be accessible on?',
        default: 'publish.somedomain.tech'
      },
      {
        name: 'publicUrl.protocol',
        message: 'What protocol will the application be accessible on?',
        choices: [
          {
            name: 'HTTPS (secure, recommended)',
            value: 'https'
          },
          {
            name: 'HTTP (insecure)',
            value: 'http'
          }
        ],
        default: 'https'
      },
      {
        name: 'publicUrl.port',
        message: 'What port will the application be accessible on?',
        default: answers => {
          return answers.publicUrl.protocol === 'https' ? 443 : 80
        }
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
        default: answers => {
          return answers.apis[0].host.indexOf('https://') === 0 ? 443 : 80
        }
      },
      {
        name: 'cdn.__enabled',
        message: 'Where would you like to load media assets from?',
        choices: [
          {
            name: 'Directly from DADI API',
            value: false
          },
          {
            name: 'From an instance of DADI CDN',
            value: true
          }
        ],
        default: false
      },
      {
        condition: answers => answers.cdn.__enabled,
        name: 'cdn.publicUrl',
        message: 'What is the full URL of the DADI CDN instance?',
        default: 'https://cdn.somedomain.tech'
      },
      {
        condition: answers => answers.cdn.__enabled,
        type: 'info',
        message: 'Note that you\'ll need to configure DADI CDN separately. You should point its remote location to the URL of your DADI API instance.'
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
    if (answers.cdn) {
      if (answers.cdn.__enabled) {
        delete answers.cdn.__enabled
      } else {
        delete answers.cdn
      }
    }

    return configHelpers.saveAppConfig({
      app,
      config: answers,
      description: 'Publish configuration file',
      fileName: `config.${answers.env}.json`
    })
  }).catch(error => {
    shellHelpers.showSpinner(
      'This directory does not seem to contain a valid installation of DADI Publish.',
      'fail'
    )

    return Promise.reject(error)
  })
}

module.exports = args => launchSetup()
module.exports.run = baseDirectory => {
  fsHelpers.cd(baseDirectory)

  return launchSetup()
}
module.exports.description = 'Launches an interactive setup wizard'
module.exports.parameters = {}
