const api = require('./../../../../entryPoints/api')

describe('API entry point', () => {
  test('exports a name property', () => {
    expect(api.name).toBe('API')
  })

  it('exports a `clients:add` command', () => {
    expect(api.commands['clients:add']).toBeInstanceOf(Function)
  })

  it('exports a `new` command', () => {
    expect(api.commands['new']).toBeInstanceOf(Function)
  })
})