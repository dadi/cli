'use strict'

const clientsAdd = require('./../clients-add')
const fsHelpers = require('./../../../../lib/fs')
const configHelpers = require('./../../../../lib/config')
const npm = require('./../../../../lib/npm')
const path = require('path')
const semverRangeCompare = require('semver-compare-range')
const Setup = require('./../../../../lib/setup')
const shellHelpers = require('./../../../../lib/shell')

// Connectors
const connectorHandlers = {
  '@dadi/api-mongodb': require('./mongodb'),
  '@dadi/api-rethinkdb': require('./rethinkdb')
}

const steps = [
  // Server
  {
    text: 'Let\'s start by configuring the web server that API runs.',
    questions: [
      {
        name: 'app.name',
        message: 'What is the name of this DADI API instance?'
      },
      {
        name: 'server.host',
        message: 'What is the IP address the application should run on?',
        default: '0.0.0.0'
      },
      {
        name: 'server.port',
        message: 'What is the port number?'
      },
      {
        type: 'list',
        name: 'server.protocol',
        message: 'What protocol would you like to use?',
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
        type: 'info',
        condition: answers => {
          return answers.server.protocol === 'https'
        },
        message: 'You\'ll need to configure the SSL passphrase and the paths to the private key and certificates.\n  Don\'t worry, you can do this easily by editing the configuration file that will be generated when we\'re done.'
      }
    ]
  },

  // Public URL
  {
    text: 'We\'ll now define how your API instance can be accessed from the outside world.',
    questions: [
      {
        name: 'publicUrl.host',
        message: 'What is the hostname or domain where your API can be accessed at?',
        default: 'my-api.com'
      },
      {
        name: 'publicUrl.host',
        message: 'What is the port?',
        default: 80
      },
      {
        type: 'list',
        name: 'publicUrl.protocol',
        message: 'What protocol?',
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
      }
    ]
  },

  // Databases
  {
    text: 'Looking great! Time to configure your databases.',
    questions: [
      {
        type: 'list',
        name: 'datastore',
        message: 'API supports different database engines – which one would you like to use?',
        choices: () => {
          return npm.search({
            filter: result => {
              return npm.filters.hasKeyword(result, 'dadi-api-connector') &&
                npm.filters.isTrusted(result)
            },
            text: 'dadi-api-connector'
          }).then(response => {
            const choices = response.map(item => {
              return {
                name: `${item.package.name} — ${item.package.description}`,
                short: item.package.name,
                value: item.package.name
              }
            })

            return choices
          })
        }
      },
      {
        name: '_meta.datastore.database',
        message: 'What is the name of the database?',
        default: 'dadiapi'
      },
      {
        name: '_meta.datastore.username',
        message: 'What is the database username?'
      },
      {
        name: '_meta.datastore.password',
        message: 'What is the database password?'
      },
      {
        condition: answers => {
          return [
            '@dadi/api-mongodb',
            '@dadi/api-rethinkdb'
          ].includes(answers.datastore)
        },
        name: '_meta.datastore.host',
        message: 'What is the database server host?',
        default: '127.0.0.1'
      },
      {
        condition: answers => {
          return [
            '@dadi/api-mongodb',
            '@dadi/api-rethinkdb'
          ].includes(answers.datastore)
        },
        name: '_meta.datastore.port',
        message: 'And what is the database server port?',
        default: answers => {
          switch (answers.datastore) {
            case '@dadi/api-mongodb': return 27017
            case '@dadi/api-rethinkdb': return 28015
          }
        }
      }
    ]
  },

  // Client
  {
    text: 'You\'ll need an oAuth2 client to interact with API. It consists of an ID + secret pair, which you\'ll send to API in exchange for a bearer token. This token is then sent alongside each request in order to authenticate you with the system.',
    questions: [
      {
        type: 'confirm',
        name: '_meta.client.create',
        message: 'Would you like to create a client?'
      },
      {
        condition: answers => answers._meta.client.create === true,
        name: '_meta.client.clientId',
        message: 'What is the client ID?'
      },
      {
        condition: answers => answers._meta.client.create === true,
        name: '_meta.client.secret',
        message: 'And what is the secret?'
      },
      {
        condition: answers => answers._meta.client.create === true,
        type: 'list',
        name: '_meta.client.accessType',
        message: 'What level of permissions should this client get?',
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
  },

  // Caching
  {
    text: 'Let\'s now look at caching, which is crucial to ensure that API delivers data in a performant way.',
    questions: [
      // Directory
      {
        name: 'caching.directory.enabled',
        message: 'Would you like to cache items on the local filesystem?'
      },
      {
        condition: answers => answers.caching.directory.enabled === true,
        name: 'caching.directory.path',
        message: 'What is the path to the cache directory?'
      },

      // Redis
      {
        name: 'caching.redis.enabled',
        message: 'Would you like to cache items on a Redis server?'
      },
      {
        condition: answers => answers.caching.redis.enabled === true,
        name: 'caching.redis.host',
        message: 'What is the host name of the Redis server?'
      },
      {
        condition: answers => answers.caching.redis.enabled === true,
        name: 'caching.redis.port',
        message: 'What is the port number of the Redis server?'
      },
      {
        condition: answers => answers.caching.redis.enabled === true,
        name: 'caching.redis.password',
        message: 'What is the password of the Redis server?'
      }
    ]
  },

  // Media
  {
    text: 'Almost there! Time to define how API handles media uploads (e.g. images).',
    questions: [
      {
        type: 'list',
        name: 'media.storage',
        choices: [
          {
            name: 'Disk storage',
            value: 'disk'
          },
          {
            name: 'Amazon S3 bucket',
            value: 's3'
          },
          {
            name: 'Nowhere, I don\'t want API to handle media',
            value: undefined
          }
        ],
        message: 'Where should API store uploaded assets?'
      },

      // Directory
      {
        condition: answers => answers.media.storage === 'disk',
        name: 'media.basePath',
        message: 'Where in the filesystem should assets be stored?'
      },

      // S3
      {
        condition: answers => answers.media.storage === 's3',
        name: 'media.s3.accessKey',
        message: 'What is the access key to the S3 bucket?'
      },
      {
        condition: answers => answers.media.storage === 's3',
        name: 'media.s3.secretKey',
        message: 'What is the secret key to the S3 bucket?'
      },
      {
        condition: answers => answers.media.storage === 's3',
        name: 'media.s3.bucketName',
        message: 'What is the name of the S3 bucket?'
      },
      {
        condition: answers => answers.media.storage === 's3',
        name: 'media.s3.region',
        message: 'What is the name of the AWS region?'
      }
    ]
  },

  {
    text: 'You made it! We\'re wrapping up.',
    questions: [
      // Environment
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

const launchSetup = ({
  initialState = {},
  showErrorMessages = true
} = {}) => {
  const app = '@dadi/api'

  return fsHelpers.loadAppFile(app, {
    filePath: 'package.json'
  }).then(pkg => {
    const isSupportedVersion = semverRangeCompare(pkg.version, '3.0.0') >= 0

    if (!isSupportedVersion) {
      if (showErrorMessages) {
        shellHelpers.showSpinner(
          `This command requires version 3.0 or greater of DADI API (${pkg.version} found)`,
          'fail'
        )
      }

      return Promise.reject(new Error('UNSUPPORTED_VERSION'))
    }

    return configHelpers.getAppConfig({
      app,
      baseDirectory: '../../api-test',
      fileName: 'config.development.json'
    })
  }).then(config => {
    const setup = new Setup(steps, config.schema)

    setup.setTitle('DADI API setup')

    return setup.start(initialState)
  }).then(answers => {
    const metaAnswers = answers._meta

    delete answers._meta

    // Add auth block
    answers.auth = {
      datastore: answers.datastore,
      database: metaAnswers.datastore.database
    }

    return configHelpers.saveAppConfig({
      app,
      config: answers,
      description: 'API configuration file',
      fileName: `config.${answers.env}.json`
    }).then(result => {
      const connector = connectorHandlers[answers.datastore]

      if (connector) {
        const dbConfig = connector.buildConfig(
          metaAnswers.datastore,
          answers
        )

        return configHelpers.saveAppConfig({
          app,
          config: dbConfig,
          description: 'Database configuration file',
          fileName: `${connector.handle}.${answers.env}.json`
        })
      }
    }).then(() => {
      if (metaAnswers.client.create) {
        const createClientMessage = shellHelpers.showSpinner('Creating a new client')

        return clientsAdd.createClient({
          clientId: metaAnswers.client.clientId,
          message: createClientMessage,
          secret: metaAnswers.client.secret,
          type: metaAnswers.client.accessType
        })
      }
    })
  })
}

module.exports = args => launchSetup()
module.exports.run = ({baseDirectory, datastore}) => {
  process.chdir(
    path.resolve(
      process.cwd(),
      baseDirectory
    )
  )

  const setupInitialState = datastore
    ? {datastore}
    : {}

  return launchSetup({
    initialState: setupInitialState,
    showErrorMessages: false
  })
}
module.exports.description = 'Launches an interactive setup wizard'
module.exports.parameters = {}
