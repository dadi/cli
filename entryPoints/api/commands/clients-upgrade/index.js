'use strict'

const colors = require('colors')
const exec = require('child_process').exec
const fs = require('fs')
const fsHelpers = require('./../../../../lib/fs')
const path = require('path')
const shell = require('./../../../../lib/shell')

function getUpgradeFunction () {
  return fs.readFileSync(
    path.join(__dirname, 'upgrade-records-api-v5.js'),
    'utf8'
  )
}

module.exports = args => {
  const message = shell.showSpinner('Analysing client records')

  return fsHelpers
    .loadAppFile('@dadi/api', {
      filePath: 'package.json'
    })
    .then(pkg => {
      const upgradeFn = getUpgradeFunction()

      return new Promise((resolve, reject) => {
        exec(`node -e "${upgradeFn}"`, (err, stdout, stderr) => {
          if (err) {
            return reject(new Error(stderr))
          }

          resolve(stdout)
        })
      })
    })
    .then(count => {
      if (message) {
        message.succeed(`Upgraded clients: ${colors.bold(count.trim())}`)
      }
    })
    .catch(err => {
      if (message) {
        message.fail('Something went wrong. Could not communicate with API.')
      }

      return Promise.reject(err)
    })
}

module.exports.description = 'Upgrades all client records to the latest format'
module.exports.parameters = {}
