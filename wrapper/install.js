const path = require('path')
const Installer = require(
  path.join(__dirname, 'lib', 'Installer')
)

const install = new Installer({
  targetDirectory: __dirname
})

install.install().catch(console.log)
