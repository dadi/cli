const colors = require('colors')
const constants = require('./constants')
const exec = require('child_process').exec
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const ProgressBar = require('progress')
const spawnSync = require('child_process').spawnSync
const UpdateCheck = require('./UpdateCheck')

const Installer = function (options) {
  this.targetDirectory = options.targetDirectory

  this.binDirectory = path.join(options.targetDirectory, 'bin')
  this.cachePath = options.cachePath
  this.target = path.join(this.binDirectory, 'dadi')
  this.targetTmp = `${this.target}.partial`
}

Installer.prototype.createRunner = function () {
  const paths = {
    core: path.join(
      this.binDirectory,
      'dadi'
    ),
    runner: path.join(
      this.binDirectory,
      'runner'
    ),
    updater: path.join(
      this.targetDirectory,
      'updater.js'
    )
  }
  const contents = `node ${paths.updater} "$@" && ${paths.core} "$@"`
  
  fs.writeFileSync(paths.runner, contents)

  this.setExecPermissions(paths.runner)
}

Installer.prototype.detectPlatform = function () {
  const platform = process.platform

  if (platform !== 'linux') {
    return platform
  }

  // https://github.com/sass/node-sass/issues/1589#issuecomment-265292579
  const ldd = spawnSync('ldd', [
    process.execPath
  ]).stdout.toString()

  return /\bmusl\b/.test(ldd) ? 'alpine' : platform
}

Installer.prototype.getBinaryURLForPlatform = function () {
  const cliBinariesUrl = constants.registryUrl + '/cli/binaries/'

  switch (this.detectPlatform()) {
    case 'alpine':
      return cliBinariesUrl + 'dadi-alpine'

    case 'darwin':
      return cliBinariesUrl + 'dadi-macos'

    case 'linux':
      return cliBinariesUrl + 'dadi-linux'

    case 'win32':
      return cliBinariesUrl + 'dadi-win.exe'

    default:
      throw new Error('PLATFORM_NOT_SUPPORTED')
  }
}

Installer.prototype.install = function (newVersion) {
  const binaryUrl = this.getBinaryURLForPlatform()

  return fetch(binaryUrl, {
    compress: false
  }).then(res => {
    try {
      fs.accessSync(this.binDirectory, (fs.constants || fs).W_OK)
    } catch (err) {
      console.log(`---------------------------------------------

${colors.bold.red('ERROR:')} DADI CLI does not have the correct permissions.

This typically happens when your npm installation is configured in such a way that global installs
require super-user permissions, which is not recommended.\

To fix this, follow the instructions on ${colors.underline('https://docs.npmjs.com/getting-started/fixing-npm-permissions')}.

Alternatively, if you're happy with using super-user, you'll need to install DADI CLI with the
${colors.underline('unsafe-perm')} flag, so that the install script gets the right permissions.

${colors.underline('sudo npm install @dadi/cli -g --unsafe-perm')}

You can read more about what it does at ${colors.underline('https://docs.npmjs.com/misc/config#unsafe-perm')}.

---------------------------------------------
`)

      process.exit(1)

      return Promise.reject()
    }

    const size = parseInt(res.headers.get('content-length'), 10)
    const writer = fs.createWriteStream(this.targetTmp)
    const progress = new ProgressBar('downloading the latest version of DADI CLI [:bar] :percent (ETA: :etas)', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: size
    })

    return new Promise((resolve, reject) => {
      res.body
        .on('error', reject)
        .on('data', chunk => {
          if (progress) {
            progress.tick(chunk.length)  
          }
        })

        res.body.pipe(writer)

        writer
          .on('error', reject)
          .on('close', resolve)
          .on('end', () => console.log('\n'))
    })
  }).then(() => {
    fs.renameSync(this.targetTmp, this.target)

    // Set +x permissions on the executable
    this.setExecPermissions(this.target)

    // Create the runner file
    this.createRunner()

    if (newVersion) {
      return newVersion
    }

    return fetch(
      `${constants.registryUrl}/v1/cli.json`
    ).then(res => res.json()).then(res => {
      return res.versionCore
    })
  }).then(version => {
    // Set permissions for cache file
    return this.setUpCache(version).then(() => version)
  })
}

Installer.prototype.setExecPermissions = function (file) {
  const s = fs.statSync(file)
  const newMode = s.mode | 64 | 8 | 1

  if (s.mode === newMode) return

  const base8 = newMode.toString(8).slice(-3)

  fs.chmodSync(file, base8)   
}

Installer.prototype.setUpCache = function (version) {
  const updater = new UpdateCheck({
    cachePath: this.cachePath
  })

  return updater.writeCache(version)
}

module.exports = Installer
