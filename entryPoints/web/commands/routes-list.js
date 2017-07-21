'use strict'

const colors = require('colors')
const mockRequire = require('mock-require')
const path = require('path')
const shell = require('./../../../lib/shell')
const validate = require('./../../../lib/validate')

const listRoutes = ({message}) => {
  let webConfig
  let webInstance

  mockRequire('console-stamp', () => {})
  console.log = function () {}

  try {
    webInstance = require(path.resolve(
      process.cwd(),
      'node_modules',
      '@dadi',
      'web'
    ))

    webConfig = webInstance.Config
  } catch (err) {
    console.log(err)
    if (message) {
      message.fail('The current directory does not seem to contain a DADI Web installation')
    }

    return
  }

  const payload = {
  }

  var getComponent = function (components, key) {
    return webInstance.App.components[key] || {}
  }

  return new Promise((resolve, reject) => {
    const components = webInstance.App.components
    const paths = webInstance.App.app.paths

    var Table = require('cli-table')

    var table = new Table({
      chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
      head: ['route', 'page', 'datasources'],
      colWidths: [50, 20, 50]
    })

    paths.forEach(p => {
      let output = {
        path: p.path,
        page: '',
        datasources: []
      }

      let component = getComponent(components, p.path)

      if (component.page) {
        output.page = component.page.name
        output.datasources = component.page.datasources
      }

      table.push(
        [p.path, output.page, output.datasources.join(', ')]
      )
    })

    if (message) {
      message.succeed(`Routes initialised, in priority order:\n${table.toString()}`)
    }

    return resolve()
  })
}

module.exports = args => {
  const message = shell.showSpinner('Listing routes')

  return listRoutes({message})
}

module.exports.description = 'Lists initialised routes'
module.exports.parameters = {
  inline: [
    {
      key: 'id',
      description: 'the client ID'
    }
  ],
  flags: [
    {
      key: 'secret',
      description: 'the client secret'
    }
  ]
}
