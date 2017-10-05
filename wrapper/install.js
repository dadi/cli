const path = require('path')
const Installer = require(
  path.join(__dirname, 'lib', 'Installer')
)

const install = new Installer({
  cachePath: path.join(
    __dirname,
    'cache.json'
  ),
  targetDirectory: __dirname
})

install.install().catch(console.log)
