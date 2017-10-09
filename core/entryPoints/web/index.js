'use strict'

module.exports = {
  name: 'Web',
  commands: {
    'routes:list': require('./commands/routes-list'),
    new: require('./commands/new')
  }
}
