const apiConfig = require('@dadi/api').Config
const apiConnection = require('@dadi/api').Connection
const clientId = process.argv[1]
const secret = process.argv[2]
const type = process.argv[3]

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

const terminate = (err, message, db) => {
  if (typeof db.close === 'function') {
    db.close()
  }

  if (err) {
    console.error(err)

    process.exit(1)
  } else {
    console.log(message)

    process.exit(0)
  }
}

let connected = false

connection.on('connect', db => {
  if (connected) return

  connected = true

  const query = {
    clientId: clientId
  }

  db.find({ query, collection: clientCollectionName, options: {}, schema: getClientStoreSchema() }).then(existingClients => {
    if (existingClients.results.length > 0) {
      terminate(new Error('ID_EXISTS'), null, db)
    }

    db.insert({ data: payload, collection: clientCollectionName, schema: getClientStoreSchema() }).then(result => {
      terminate(null, result, db)
    }).catch(err => {
      terminate(err, null, db)
    })
  }).catch(err => {
    terminate(err, null, db)
  })
})
