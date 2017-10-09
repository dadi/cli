'use strict'

const fsHelpers = require('./../../../lib/fs')
const mockRequire = require('mock-require')
const shell = require('./../../../lib/shell')
const Table = require('cli-table')

const listRoutes = ({page, filter, message}) => {
  // Mocking these modules so that Web doesn't polute stdout.
  mockRequire('console-stamp', () => {})
  mockRequire('bunyan', {
    createLogger: () => ({
      addStream: () => {}
    }),
    resolveLevel: () => {}
  })
  console.log = function () {}

  const getComponent = (components, key) => {
    return components[key] || {}
  }

  return fsHelpers.loadApp('@dadi/web').then(app => {
    console.log(app.module)
    const components = app.module.App.components
    const paths = app.module.App.app.paths

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
  }).catch(err => {
    console.log(err)

    if (message) {
      message.fail('The current directory does not seem to contain a DADI Web installation')
    }
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
