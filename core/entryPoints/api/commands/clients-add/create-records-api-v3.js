const shell = require('./../../../../lib/shell')

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

module.exports = ({
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

      const query = {
        clientId: clientId
      }

      db.find({ query, collection: clientCollectionName, options: {}, schema: getClientStoreSchema() }).then(existingClients => {
        if (existingClients.results.length > 0) {
          shell.killProcess()

          return reject(new Error('ID_EXISTS'))
        }

        db.insert({ data: payload, collection: clientCollectionName, schema: getClientStoreSchema() }).then(result => {
          shell.killProcess()

          return resolve(result)
        }).catch((err) => {
          shell.killProcess()

          return reject(err)
        })
      }).catch((err) => {
        shell.killProcess()

        return reject(err)
      })
    })
  })
}
