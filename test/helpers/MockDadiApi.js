const mockConfig = {
  'auth.clientCollection': 'collection',
  'auth.database': 'database',
  'auth.datastore': 'datastore'
}

let existingClients

let mockACL = {
  client: {
    create: jest.fn(() => Promise.resolve({})),
    find: jest.fn(() =>
      Promise.resolve({
        results: existingClients
      })
    )
  },
  model: {
    connection: {
      readyState: 1
    }
  }
}

let mockDatabase = {
  find: jest.fn(() =>
    Promise.resolve({
      results: existingClients
    })
  ),

  insert: jest.fn(() =>
    Promise.resolve({
      mockClient: true
    })
  )
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

  mockACL.client.create.mockClear()
  mockACL.client.find.mockClear()
  mockDatabase.find.mockClear()
  mockDatabase.insert.mockClear()
  mockConnection.mockClear()
})

module.exports = {
  ACL: mockACL,
  Connection: mockConnection,
  Config: {
    get: parameter => mockConfig[parameter]
  }
}

module.exports.mockACL = mockACL
module.exports.mockDatabase = mockDatabase
module.exports.mockConfig = mockConfig
module.exports.mockConnection = mockConnection

module.exports.setExistingClients = clients => {
  existingClients = clients
}
