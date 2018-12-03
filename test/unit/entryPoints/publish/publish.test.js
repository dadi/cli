const publish = require('./../../../../entryPoints/publish')

describe('Publish entry point', () => {
  test('exports a name property', () => {
    expect(publish.name).toBe('Publish')
  })

  it('exports a `new` command', () => {
    expect(publish.commands['new']).toBeInstanceOf(Function)
  })
})