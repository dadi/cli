module.exports = ({
  apiConfig,
  apiConnection,
  clientId,
  secret,
  type
}) => {
  const options = apiConfig.get('auth.database')
  options.auth = true

  const connection = apiConnection(options)
  const clientCollectionName = apiConfig.get('auth.clientCollection')
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

      const existingClients = db.collection(clientCollectionName).find({
        clientId: clientId
      })

      existingClients.toArray((err, documents) => {
        if (err) {
          return reject(err)
        }

        if (documents.length > 0) {
          db.close()

          return reject(new Error('ID_EXISTS'))
        }

        db.collection(clientCollectionName).insert(payload, (err, docs) => {
          if (err) {
            return reject(err)
          }

          db.close()

          return resolve(docs)
        })
      })
    })
  })
}
