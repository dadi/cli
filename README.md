<img src="https://dadi.tech/assets/products/dadi-cli.png?v=1" alt="DADI CLI logo" height="65"/>

[![npm (scoped)](https://img.shields.io/npm/v/@dadi/cli.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/@dadi/cli)
[![coverage](https://img.shields.io/badge/coverage-78%-yellow.svg?style=flat?style=flat-square)](https://github.com/dadi/cli)
[![Build Status](https://travis-ci.org/dadi/cli.svg?branch=master)](https://travis-ci.org/dadi/cli)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

# DADI CLI

## Overview

DADI CLI is a command-line tool to help with the installation and customisation of the various products of the DADI platform.

## Installation

DADI CLI is installed with NPM, as a global module.

 ```
 npm install @dadi/cli -g
 ```

 Depending on how your NPM installation is configured, you might require super-user permissions to install a global module. This means that your regular user does not have permissions to write to the directories that NPM uses to store global packages and commands. You can fix this by following the instructions on the [NPM documentation pages](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

 If you don't mind using the super-user to install global NPM modules, you need to install DADI CLI using the [`--unsafe-perm`](https://docs.npmjs.com/misc/config#unsafe-perm) flag.

```
npm install @dadi/cli -g --unsafe-perm
```

## Updating CLI

CLI includes an auto-update feature, which makes it possible for you to use the latest versions of our products, as we roll them out, without having to manually update the CLI module.

In some rare occasions, where an update can't be installed automatically, we might ask you to update DADI CLI manually, which you can do with a single command:

```
[sudo] npm update @dadi/cli -g
```

## Usage

Commands always start with `dadi <product> <command>`, taking different parameters and flags depending on the operation.

The command `dadi help` shows a list of all the available commands for the various products, whilst `dadi help <product>` and `dadi help <product> <command>` provides detailed information about a product and a command, respectively.

## Links
* [CLI Documentation](https://docs.dadi.cloud/cli/)

## Development

The repository is separated into two main directories:

- `wrapper`: A thin wrapper that will download and execute CLI binaries. This is the application that gets published to NPM as `@dadi/cli`.
- `core`: Where the main application lives. This application will be packaged using [pkg](https://github.com/zeit/pkg) to generate the CLI binaries.

Most of the development work will be done on the `core` directory. To get started, run:

```shell
# Install dependencies
cd core && npm install

# Run the `dadi help` command
node index.js help
```

By default, CLI will communicate with the live registry server at https://registry.dadi.tech. When developing, you might want to use your own local registry, in case you want to test assets that are not yet available on live.

To do this, grab a copy of the [registry repository](https://github.com/dadi/registry), start a local server, and tell CLI the URL of the registry to use.

```shell
# If your registry server is available at http://localhost:7100
REGISTRY_URL="http://localhost:7100" node index.js help
```

## Licence

DADI is a data centric development and delivery stack, built specifically in support of the principles of API first and COPE.

Copyright notice<br />
(C) 2017 DADI+ Limited <support@dadi.tech><br />
All rights reserved

This product is part of DADI.<br />
DADI is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version ("the GPL").

**If you wish to use DADI outside the scope of the GPL, please
contact us at info@dadi.co for details of alternative licence
arrangements.**

**This product may be distributed alongside other components
available under different licences (which may not be GPL). See
those components themselves, or the documentation accompanying
them, to determine what licences are applicable.**

DADI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

The GNU General Public License (GPL) is available at
http://www.gnu.org/licenses/gpl-3.0.en.html.<br />
A copy can be found in the file GPL.md distributed with
these files.

This copyright notice MUST APPEAR in all copies of the product!
