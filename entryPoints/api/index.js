'use strict'

module.exports = {
  name: 'API',
  commands: {
    'clients:add': require('./commands/clients-add'),
    new: require('./commands/new')
  }
}
