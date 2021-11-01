# CRA-Templetize

![GitHub package.json dynamic](https://img.shields.io/github/package-json/keywords/khalidx/typescript-cli-starter.svg?style=flat-square)
![GitHub](https://img.shields.io/github/license/khalidx/typescript-cli-starter.svg?style=flat-square)

Scripts to create CRA template from react projects.

## Usage

Please follow below steps to create cra-template with cra-templetize

1. Create react application with create-react-app
2. Do necessary changes to the application.
3. Run `npx cra-templetize -i <source project directory> -o <target project directory>`

The template project will be created in `<target project directory>/cra-template-<source project name>`

***This tool can be used in monorepo environments as a pre-build script, to generate a template from sample
module.***
