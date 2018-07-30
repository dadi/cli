const apiConfig = require('@dadi/api').Config
const apiConnection = require('@dadi/api').Connection
const clientId = process.argv[1]
const secret = process.argv[2]
const accessType = process.argv[3]

const options = apiConfig.get('auth.database')
options.auth = true

const connection = apiConnection(options)
const clientCollectionName = apiConfig.get('auth.clientCollection')
const payload = {
  clientId,
  secret,
  accessType
}

let connected = false

connection.on('connect', db => {
  if (connected) return

  connected = true

  const existingClients = db.collection(clientCollectionName).find({
    clientId: clientId
  })

  existingClients.toArray((err, documents) => {
    if (err) {
      db.close()

      process.exit(1)
    }

    if (documents.length > 0) {
      db.close()

      console.error('ID_EXISTS')

      process.exit(1)
    }

    db.collection(clientCollectionName).insert(payload, (err, docs) => {
      db.close()

      if (err) {
        process.exit(1)
      }

      console.log(docs)
      process.exit(0)
    })
  })
})
