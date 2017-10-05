const cdn = require('./../../../../entryPoints/cdn')

describe('CDN entry point', () => {
  test('exports a name property', () => {
    expect(cdn.name).toBe('CDN')
  })

  it('exports a `new` command', () => {
    expect(cdn.commands['new']).toBeInstanceOf(Function)
  })
})