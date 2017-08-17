'use strict'

const mockRequire = require('mock-require')
const path = require('path')
const shell = require('./../../../lib/shell')
const Table = require('cli-table')

const listRoutes = ({page, filter, message}) => {
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
  } catch (err) {
    console.log(err)
    if (message) {
      message.fail('The current directory does not seem to contain a DADI Web installation')
    }

    return
  }

  const getComponent = function (components, key) {
    return webInstance.App.components[key] || {}
  }

  return new Promise((resolve, reject) => {
    const components = webInstance.App.components
    const paths = webInstance.App.app.paths

    let routes = []

    let table = new Table({
      chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
      head: ['route', 'page', 'datasources'],
      colWidths: [50, 20, 50]
    })

    paths.forEach(p => {
      let output = {
        path: p.path,
        page: ''
      }

      let component = getComponent(components, p.path)

      if (component.page) {
        output.page = component.page.name
        output.component = component
      }

      routes.push(output)
    })

    if (page) {
      routes = routes.filter(route => {
        return route.page === page
      })
    }

    if (filter) {
      routes = routes.filter(route => {
        return route.path.indexOf(filter) > -1
      })
    }

    routes.forEach(route => {
      let datasources = []

      if (route.component && route.component.page) {
        datasources = route.component.page.datasources
      }

      table.push(
        [route.path, route.page, datasources.join(', ')]
      )
    })

    if (message) {
      message.info(`Routes initialised, in priority order:\n${table.toString()}`)
    }

    return resolve()
  })
}

module.exports = args => {
  const message = shell.showSpinner('Listing routes')

  return listRoutes({
    page: args.page,
    filter: args.filter || '',
    message
  })
}

module.exports.description = 'Lists initialised routes'
module.exports.parameters = {
  flags: [
    {
      key: 'page',
      description: 'see all routes for a particular page'
    },
    {
      key: 'filter',
      description: 'see all routes that start with a string'
    }
  ]
}
