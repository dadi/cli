const colors = require('colors')
const path = require('path')
const Installer = require(
  path.join(__dirname, 'lib', 'Installer')
)
const UpdateCheck = require(
  path.join(__dirname, 'lib', 'UpdateCheck')
)

const cachePath = path.join(
  __dirname,
  'cache.json'
)
const updater = new UpdateCheck({
  cachePath
})

updater.checkForUpdates({
  forceUpdate: process.argv[2] === 'update'
}).then(newVersion => {
  if (newVersion) {
    const installer = new Installer({
      cachePath,
      targetDirectory: __dirname
    })

    return installer.install(newVersion).then(() => {
      updater.installationHasFinished(newVersion)
    })
  }
}).catch(err => {
  if (err.code === 'EACCES') {
    console.log(`${colors.bold.red('ERROR:')} DADI CLI failed to write to disk.

If you installed the ${colors.underline('@dadi/cli')} package as a super user\
 (i.e. ${colors.underline('sudo npm install @dadi/cli -g')}), you also need to run all DADI CLI\
 commands with the ${colors.underline('sudo')} prefix.

Alternatively, see\
 ${colors.underline('https://docs.npmjs.com/getting-started/fixing-npm-permissions')}\
 for instructions on how to remove the need for using super user with your NPM installation.`)

    process.exit(1)
  }
})
