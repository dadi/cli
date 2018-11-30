const web = require('./../../../../entryPoints/web')

describe('Web entry point', () => {
  test('exports a name property', () => {
    expect(web.name).toBe('Web')
  })

  it('exports a `new` command', () => {
    expect(web.commands['new']).toBeInstanceOf(Function)
  })
})