const apiACL = require('@dadi/api').ACL
const apiConfig = require('@dadi/api').Config
const apiConnection = require('@dadi/api').Connection
const clientId = process.argv[1]
const secret = process.argv[2]
const accessType = process.argv[3]

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

  apiACL.client
    .create(
      {
        accessType,
        clientId,
        secret
      },
      {
        allowAccessType: true
      }
    )
    .then(response => {
      terminate(null, response, db)
    })
    .catch(error => {
      terminate(error, null, db)
    })
})
