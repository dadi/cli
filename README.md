<img src="https://dadi.tech/assets/products/dadi-cli.png?v=1" alt="DADI CLI logo" height="65"/>

[![npm (scoped)](https://img.shields.io/npm/v/@dadi/cli.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/@dadi/cli)
[![coverage](https://img.shields.io/badge/coverage-53%25-red.svg?style=flat?style=flat-square)](https://github.com/dadi/cli)
[![Build Status](https://travis-ci.org/dadi/cli.svg?branch=master)](https://travis-ci.org/dadi/cli)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

# DADI CLI

## Overview

DADI CLI is a command-line tool to help with the installation and customisation of the various products of the DADI platform.

## Installation

This tool is still under development and therefore is not yet available on NPM. In the meantime, follow these steps to install it:

- Clone the repository

   ```
   git clone git@github.com:dadi/cli.git
   ```

- Install it as a global module
   
   ```
   cd cli
   npm install . -g
   ```

## Usage

Commands always start with `dadi <product> <command>`, taking different parameters and flags depending on the operation.

The command `dadi help` shows a list of all the available commands for the various products, whilst `dadi help <product>` and `dadi help <product> <command>` provides detailed information about a product and a command, respectively.

```shell
$ dadi help
╔══════════════╗
║              ║
║   DADI CLI   ║
║              ║
╚══════════════╝

> Web
dadi web new      Creates a new instance of DADI Web

---

Type dadi help <command> to learn more about a specific command.

$
```
