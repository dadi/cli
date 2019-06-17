'use strict'

module.exports = {
  name: 'API',
  commands: {
    'clients:add': require('./commands/clients-add'),
    'clients:upgrade': require('./commands/clients-upgrade'),
    new: require('./commands/new'),
    setup: require('./commands/setup')
  }
}
