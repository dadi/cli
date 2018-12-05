'use strict'

const configHelpers = require('./../../../lib/config')
const fsHelpers = require('./../../../lib/fs')
const Setup = require('./../../../lib/setup')
const shellHelpers = require('./../../../lib/shell')

const steps = [
  // Server
  {
    text: 'Let\'s start by configuring the web server that DADI CDN will run on.',
    questions: [
      {
        name: 'server.name',
        message: 'What is the name of this CDN instance?'
      },
      {
        type: 'list',
        name: 'server.protocol',
        message: 'What protocol should this CDN instance run on?',
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
        condition: answers => answers.server.protocol === 'https',
        name: 'server.sslPassphrase',
        message: 'What is the passphrase of the SSL key you\'d like to use?'
      },
      {
        condition: answers => answers.server.protocol === 'https',
        name: 'server.sslPrivateKeyPath',
        message: 'What is the path to the filename of the SSL private key?'
      },
      {
        condition: answers => answers.server.protocol === 'https',
        name: 'server.sslCertificatePath',
        message: 'What is the path to the filename of the SSL certificate?'
      },
      {
        name: 'server.host',
        message: 'What is the IP address the application should run on?'
      },
      {
        name: 'server.port',
        message: 'What is the port number the application should run on?'
      }
    ]
  },

  // Images
  {
    text: 'Time to configure the sources that CDN will use to retrieve images.',
    questions: [
      // Directory
      {
        name: 'images.directory.enabled',
        message: 'Would you like to load images from the local filesystem?'
      },
      {
        condition: answers => answers.images.directory.enabled === true,
        name: 'images.directory.path',
        message: 'What is the path to the images directory?'
      },

      // S3
      {
        name: 'images.s3.enabled',
        message: 'Would you like to load images from Amazon S3?'
      },
      {
        condition: answers => answers.images.s3.enabled === true,
        name: 'images.s3.accessKey',
        message: 'What is the access key to the S3 bucket?'
      },
      {
        condition: answers => answers.images.s3.enabled === true,
        name: 'images.s3.secretKey',
        message: 'What is the secret key to the S3 bucket?'
      },
      {
        condition: answers => answers.images.s3.enabled === true,
        name: 'images.s3.bucketName',
        message: 'What is the name of the S3 bucket?'
      },
      {
        condition: answers => answers.images.s3.enabled === true,
        name: 'images.s3.region',
        message: 'What is the name of the AWS region?'
      },

      // Remote
      {
        name: 'images.remote.enabled',
        message: 'Would you like to load images from a remote URL?'
      },
      {
        condition: answers => answers.images.remote.enabled === true,
        name: 'images.remote.path',
        message: 'The base URL to load remote images from (e.g. if set to `http://somedomain.tech`, accessing `/car.jpg` will retrieve `http://somedomain.tech/car.jpg`)'
      },
      {
        condition: answers => answers.images.remote.enabled === true,
        name: 'images.remote.allowFullURL',
        message: 'Would you like to allow remote images to be retrieved from any remote URL? This would allow consumers to load images from URLs like `http://your-cdn.com/http://somedomain.tech/image.jpg`.'
      }
    ]
  },

  // Assets
  {
    text: 'Great! Let\'s now define how CDN handles other assets (e.g. CSS, JS or fonts)',
    questions: [
      // Directory
      {
        name: 'assets.directory.enabled',
        message: 'Would you like to load assets from the local filesystem?'
      },
      {
        condition: answers => answers.assets.directory.enabled === true,
        name: 'assets.directory.path',
        message: 'What is the path to the assets directory?'
      },

      // S3
      {
        name: 'assets.s3.enabled',
        message: 'Would you like to load assets from Amazon S3?'
      },
      {
        condition: answers => answers.assets.s3.enabled === true,
        name: 'assets.s3.accessKey',
        message: 'What is the access key to the S3 bucket?'
      },
      {
        condition: answers => answers.assets.s3.enabled === true,
        name: 'assets.s3.secretKey',
        message: 'What is the secret key to the S3 bucket?'
      },
      {
        condition: answers => answers.assets.s3.enabled === true,
        name: 'assets.s3.bucketName',
        message: 'What is the name of the S3 bucket?'
      },
      {
        condition: answers => answers.assets.s3.enabled === true,
        name: 'assets.s3.region',
        message: 'What is the name of the AWS region?'
      },

      // Remote
      {
        name: 'assets.remote.enabled',
        message: 'Would you like to load assets from a remote URL?'
      },
      {
        condition: answers => answers.assets.remote.enabled === true,
        name: 'assets.remote.path',
        message: 'The base URL to load remote assets from (e.g. if set to `http://somedomain.tech`, accessing `/car.jpg` will retrieve `http://somedomain.tech/car.jpg`)'
      }
    ]
  },

  // Caching
  {
    text: 'Let\'s now look at caching, which is crucial to ensure that CDN delivers images and assets in a performant way.',
    questions: [
      {
        name: 'caching.ttl',
        message: 'What is the time-to-live (TTL), in seconds, of cached items?'
      },

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

  // Auth
  {
    text: 'Super. You also need to configure the credentials for authenticated consumers to use via oAuth.',
    questions: [
      {
        name: 'auth.clientId',
        message: 'What ID should authenticated clients use?'
      },
      {
        name: 'auth.secret',
        message: 'What secret should authenticated clients use?'
      },
      {
        name: 'auth.tokenTtl',
        message: 'What is the time-to-live (TTL), in seconds, for oAuth tokens?'
      }
    ]
  },

  {
    text: 'Almost there! A couple more questions about your CDN installation.',
    questions: [
      // Cluster
      {
        name: 'cluster',
        message: 'Would you like DADI CDN to run in cluster mode, starting a worker for each CPU core?'
      },

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

const launchSetup = () => {
  const app = '@dadi/cdn'

  return configHelpers.getAppConfig({
    app,
    fileName: 'config.development.json'
  }).then(config => {
    const setup = new Setup(steps, config.schema)

    setup.setTitle('DADI CDN setup')

    return setup.start()
  }).then(answers => {
    return configHelpers.saveAppConfig({
      app,
      config: answers,
      description: 'CDN configuration file',
      fileName: `config.${answers.env}.json`
    })
  }).catch(error => {
    shellHelpers.showSpinner(
      'This directory does not seem to contain a valid installation of DADI CDN.',
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
