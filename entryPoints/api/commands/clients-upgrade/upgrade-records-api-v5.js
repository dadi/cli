'use strict'

const ACL = require('@dadi/api').ACL

if (typeof console.restoreConsole === 'function') {
  console.restoreConsole()
}

function waitForDatabaseConnection () {
  const { model } = ACL.client

  return new Promise(resolve => {
    if (model.connection.readyState === 1) {
      return resolve()
    } else {
      model.connection.once('connect', resolve)
    }
  })
}

waitForDatabaseConnection()
  .then(() => {
    return ACL.client.model.find({
      query: {
        _hashVersion: null
      }
    })
  })
  .then(({ results }) => {
    const queue = results.map(result => {
      return ACL.client.update(result.clientId, {
        secret: result.secret
      })
    })

    return Promise.all(queue).then(() => results)
  })
  .then(results => {
    console.log(results.length)

    setTimeout(() => {
      process.exit(0)
    }, 1000)
  })
  .catch(error => {
    console.log(error)

    process.exit(1)
  })
