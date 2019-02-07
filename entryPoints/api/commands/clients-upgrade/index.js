'use strict'

const ACL = require('@dadi/api').ACL
const colors = require('colors')
const shell = require('./../../../../lib/shell')

function waitForDatabaseConnection() {
  const {model} = ACL.client

  return new Promise((resolve, reject) => {
    if (model.connection.readyState === 1) {
      return resolve()
    } else {
      model.connection.once('connect', resolve)
    }
  })
}

module.exports = args => {
  const message = shell.showSpinner('Analysing client records')

  return waitForDatabaseConnection().then(() => {
    return ACL.client.model.find({
      query: {
        _hashVersion: null
      }
    })
  }).then(({results}) => {
    const queue = results.map(result => {
      return ACL.client.update(result.clientId, {
        secret: result.secret
      })
    })

    return Promise.all(queue).then(() => results)
  }).then(results => {
    message.succeed(`Upgraded clients: ${results.length}`)

    return
  }).catch(error => {
    message.fail('Could not find any client records')

    return
  })
}

module.exports.description = 'Upgrades all client records to the latest format'
module.exports.parameters = {}
