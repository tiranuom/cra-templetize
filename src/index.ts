import * as path from "path";
import * as fs from "fs";
import * as fse from 'fs-extra'
import * as Handlebars from "handlebars";

export interface Args {
  source: string
  target: string
}

function removeTemplateDir(templateDir: string) {
  if (fs.existsSync(templateDir)) {
    fs.rmdirSync(templateDir, {
      recursive: true
    })
  }
  fs.mkdirSync(templateDir)
}

function generatePackageJson(packageJson, templateDir: string, name: string) {
  let packageJsonContent = JSON.stringify({
    name: name,
    version: packageJson.version,
    keywords: [...(packageJson.keywords || []), "cra-template", "react"],
    description: packageJson.description,
    files: [
      "template",
      "template.json"
    ]
  }, null, 2);

  fs.writeFileSync(path.join(templateDir, 'package.json'), packageJsonContent)
}

function generateTemplateJson(packageJson, templateDir: string) {
  const templatePackage = {
    ...packageJson
  }

  delete templatePackage.name
  delete templatePackage.version
  delete templatePackage.keywords
  delete templatePackage.description
  delete templatePackage.author
  delete templatePackage.license
  delete templatePackage.contributors
  delete templatePackage.homepage
  delete templatePackage.private

  let templateJson = JSON.stringify({
    "package": {
      ...templatePackage,
    }
  }, null, 2);

  fs.writeFileSync(path.join(templateDir, 'template.json'), templateJson)
}

function addTemplateResources(templateDir: string, source: string) {
  fs.mkdirSync(path.join(templateDir, 'template'))

  for (let name of fs.readdirSync(source)) {
    if (!['package.json', 'package-lock.json', 'yarn.lock', 'npm.lock', '.gitignore', 'node_modules'].includes(name)) {
      fse.copySync(path.join(source, name), path.join(templateDir, 'template', name), {
        recursive: true
      })
    }
    if (name === '.gitignore') {
      fse.copySync(path.join(source, name), path.join(templateDir, 'template', 'gitignore'), {
        recursive: true
      })
    }
  }
}

function extractTemplateName(packageJson) {
  let groups = packageJson.name.match(/^@([^/]+)\/([^/]+$)/);
  if (!!groups) {
    return [`cra-template-${groups[2]}`, groups[1]];
  }
  return [`cra-template-${packageJson.name}`];
}

export async function templetize({target, source}: Args) {
  if(!fs.existsSync(source)) {
    console.error("Cannot find source directory")
    process.exit(1)
  }

  if (!fs.existsSync(target)) {
    console.error("Cannot find target directory")
    process.exit(1)
  }

  let packageJsonPath = path.join(source, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error("Cannot find source package json")
    process.exit(1)
  }

  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  let [templateName, scope] = extractTemplateName(packageJson);
  let templateDir = path.join(target, templateName);

  removeTemplateDir(templateDir);
  generatePackageJson(packageJson, templateDir, scope ? `@${scope}/${templateName}`: templateName);
  generateTemplateJson(packageJson, templateDir);
  addTemplateResources(templateDir, source);

  let readmeContent = Handlebars.compile(README_TEMPLATE)({
    ...packageJson
  });
  fs.writeFileSync(path.join(templateDir, 'README.md'), readmeContent)
}

const README_TEMPLATE = `
# Create react app template for {{name}}

{{description}}

### How to use this template.

Run following command to create a project with this template.
${"```"}shell
npx create-react-app <project-name> --template {{name}}
${"```"}
`
