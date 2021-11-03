import * as path from "path";
import * as fs from "fs";
import * as fse from 'fs-extra'
import * as Handlebars from "handlebars";

export interface Args {
  source: string
  target: string
  config?: string
}

function removeTemplateDir(templateDir: string) {
  if (fs.existsSync(templateDir)) {
    fs.rmdirSync(templateDir, {
      recursive: true
    })
  }
  fs.mkdirSync(templateDir)
}

function generatePackageJson(packageJson, templateDir: string, name: string, templateConfig: TemplateConfig) {
  let packageJsonContent = JSON.stringify({
    name: name,
    version: packageJson.version,
    keywords: [...(templateConfig.keywords ?? [...(packageJson.keywords || [])]), "cra-template", "react"],
    description: templateConfig.description ?? packageJson.description,
    private: templateConfig.private,
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

function addTemplateResources(templateDir: string, source: string, templateConfig: TemplateConfig) {
  fs.mkdirSync(path.join(templateDir, 'template'))

  if (!!templateConfig.include) {
    for (let src of templateConfig.include) {
      if (!!fs.existsSync(path.join(source, src))) {
        fse.copySync(path.join(source, src), path.join(templateDir, 'template', path.basename(src)), { recursive: true })
      }
    }
  }

  fse.copySync(source, path.join(templateDir, 'template'), {
    recursive: true,
    filter(src: string, dest: string) {
      for (let skipPath of [...templateSkipPaths, ...(templateConfig.exclude ?? []), ...(templateConfig.readme ? [templateConfig.readme] : [])]) {
        if (src.startsWith(path.join(source, skipPath))) return false
      }
      return true
    }
  })
  if (fs.existsSync(path.join(source, '.gitignore'))) {
    fse.copySync(path.join(source, '.gitignore'), path.join(templateDir, 'template', 'gitignore'))
  }
}

function extractTemplateName(templateConfig: TemplateConfig) {
  let groups = templateConfig.name.match(/^@([^/]+)\/([^/]+$)/);
  if (!!groups) {
    return [`cra-template-${groups[2]}`, groups[1]];
  }
  return [`cra-template-${templateConfig.name}`];
}

export async function templetize({target, source, config}: Args) {
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

  if (config && !fs.existsSync(config)) {
    console.error("Invaid configuration")
    process.exit(1)
  }

  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

  const templateConfig: TemplateConfig = config ? JSON.parse(fs.readFileSync(config).toString()) : {
    name: packageJson.name
  }
  let [templateName, scope] = extractTemplateName(templateConfig);
  let templateDir = path.join(target, templateName);

  removeTemplateDir(templateDir);
  generatePackageJson(packageJson, templateDir, scope ? `@${scope}/${templateName}`: templateName, templateConfig);
  generateTemplateJson(packageJson, templateDir);
  addTemplateResources(templateDir, source, templateConfig);

  if (templateConfig.readme && fs.existsSync(path.join(path.dirname(config), templateConfig.readme))) {
    fse.copySync(path.join(path.dirname(config), templateConfig.readme), path.join(templateDir, 'README.md'))
  } else {
    let readmeContent = Handlebars.compile(README_TEMPLATE)({
      ...packageJson
    });
    fs.writeFileSync(path.join(templateDir, 'README.md'), readmeContent)
  }
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

interface TemplateConfig {
  name?: string,
  include?: string[]
  exclude?: string[]
  readme?: string
  keywords?: string[]
  private?: boolean
  description?: string
}

const templateSkipPaths = [
  'package.json', 'package-lock.json', 'yarn.lock', 'npm.lock', '.gitignore', 'node_modules', 'dist', 'template-config.json'
]
