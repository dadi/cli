'use strict'

const apiACL = require('@dadi/api').ACL
const apiConfig = require('@dadi/api').Config
const apiConnection = require('@dadi/api').Connection

if (typeof console.restoreConsole === 'function') {
  console.restoreConsole()
}

function terminate (err, message, db) {
  const exitProcess = () => {
    if (err) {
      console.error(err)

      process.exit(1)
    } else {
      console.log(message)

      process.exit(0)
    }
  }

  if (typeof db.close === 'function') {
    db.close().then(exitProcess)
  } else {
    exitProcess()
  }
}

const clientCollectionName = apiConfig.get('auth.clientCollection')
const dbOptions = {
  auth: true,
  database: apiConfig.get('auth.database'),
  collection: clientCollectionName
}
const connection = apiConnection(dbOptions, apiConfig.get('auth.datastore'))

let connected = false

connection.on('connect', db => {
  if (connected) return

  connected = true

  return apiACL.client.model
    .find({
      query: {
        _hashVersion: null
      }
    })
    .then(({ results }) => {
      const queue = results.map(result => {
        return apiACL.client.update(result.clientId, {
          secret: result.secret
        })
      })

      return Promise.all(queue).then(() => results)
    })
    .then(results => {
      return terminate(null, results.length, db)
    })
    .catch(error => {
      return terminate(error, null, db)
    })
})
