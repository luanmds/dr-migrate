
# Installation

Follow the below steps to install this package globally. Before you start, you need to have `npm`.

- Download the `dr-migrate-version.tgz` file from [GitHub](https://github.com/decisionrules)
- Open command line and navigate to a directory with the `dr-migrate-version.tgz` file in it
- `npm init -y`
- `npm install dr-migrate-version.tgz -g`
- Now you should be able to run `dr-migrate` from anywhere
- Edit `config.json` to define your own environments


# Publish new version

- Change version number in `package.json`
- Create tgz file by running `npm pack`
- Publish `dr-migrate-version.tgz` file where you like

