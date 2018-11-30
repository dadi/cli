const mockConfig = {
  'auth.clientCollection': 'collection',
  'auth.database': 'database',
  'auth.datastore': 'datastore'
}

let existingClients

let mockDatabase = {
  find: jest.fn(() => Promise.resolve({
    results: existingClients
  })),

  insert: jest.fn(() => Promise.resolve({}))
}

let mockConnection = jest.fn((options, datastore) => {
  return {
    on: (event, callback) => {
      if (event === 'connect') {
        callback(mockDatabase)
      }
    }
  }
})

beforeEach(() => {
  existingClients = []

  mockDatabase.find.mockClear()
  mockDatabase.insert.mockClear()
  mockConnection.mockClear()
})

module.exports = {
  Connection: mockConnection,

  Config: {
    get: parameter => mockConfig[parameter]
  }
}

module.exports.mockDatabase = mockDatabase
module.exports.mockConfig = mockConfig
module.exports.mockConnection = mockConnection

module.exports.setExistingClients = clients => {
  existingClients = clients
}
