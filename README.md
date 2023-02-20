
# Installation

Follow the below steps to install this package globally. Before you start, you need to have `npm`.

- Download the `dr-migrate-version.tgz` file from [GitHub](https://github.com/decisionrules/dr-migrate/releases)
- Open command line
- Navigate to a directory with the `dr-migrate-version.tgz` file in it
- `npm init -y`
- `npm install dr-migrate-version.tgz -g`
- Now you should be able to run `dr-migrate` from anywhere
- Navigate to a preferred directory that will be used for migration
- Run `dr-migrate init` to create sample config file in this directory
- Edit the created `config.json` file to define your own environments
- Now you can use the migration commands


# Usage Notes

Exported rules are saved to files in the `tmp` directory. The directory will be created if it does not exist.

Upon every export operation with id `custom-id`, a file called `rules_custom-id_source.json` is created. You can then use this file to import the rules to another environment.

Upon every import operation with id `custom-id`, all rules from target are exported to a file called `rules_custom-id_target.json`. This happens before any write operations in the target. The file should therefore contain the full image of the rules in the target environment before the import.

If something goes wrong with your import, you can force the rules from the `rules_custom-id_target.json` file back to the target environment and thus recover it, using a command like this:

`import --id=custom-id --env=your-target-env --strategy=FORCE_IMPOSE`

Imports performed with `FORCE_IMPOSE` or `FORCE_PUSH` strategy should be used with caution.


# Publish new version

- Change version number in `package.json`
- Check what you include by running `npm pack --dry-run` and checking files
- Create tgz file by running `npm pack`
- Publish `dr-migrate-version.tgz` file where you like



