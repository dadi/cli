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

const isForceUpdate = process.argv[2] === 'update'

updater.checkForUpdates({
  forceUpdate: isForceUpdate
}).then(newVersion => {
  if (isForceUpdate) {
    process.exit(1)

    return
  }

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
  switch (err.code) {
    case 'EACCES':
      console.log(`${colors.bold.red('ERROR:')} DADI CLI failed to write to disk.

If you installed the ${colors.underline('@dadi/cli')} package as a super user\
 (i.e. ${colors.underline('sudo npm install @dadi/cli -g')}), you also need to run all DADI CLI\
 commands with the ${colors.underline('sudo')} prefix.

Alternatively, see\
 ${colors.underline('https://docs.npmjs.com/getting-started/fixing-npm-permissions')}\
 for instructions on how to remove the need for using super user with your NPM installation.`)

      break

    case 'WRAPPER_UPDATE':
      console.log(`${colors.bold.red('ERROR:')} DADI CLI needs a manual update.

Please run ${colors.underline('npm update @dadi/cli -g')} to update it.`)

      break
  }

  process.exit(1)
})
