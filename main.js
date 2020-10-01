const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const path = require('path')
const childProcess = require('child_process')
const createAPIIndex = require('./api-index.js')
const createAPIRoute = require('./api-route.js')
const createConfiguration = require('./configuration.js')
const createDocumentation = require('./documentation.js')
const createUIIndex = require('./ui-index.js')
const createUIRoute = require('./ui-route.js')
const createUISitemap = require('./ui-sitemap.js')
const documentationPath = process.env.DOCUMENTATION_PATH || process.argv[2]
const dashboardServerPath = process.env.DASHBOARD_SERVER_PATH || process.argv[3]
global.rootPath = __dirname
global.applicationPath = __dirname

async function start () {
  // purge old files
  for (const folder of ['public', 'account', 'administrator', 'api']) {
    childProcess.execSync(`rm -rf ${documentationPath}/${folder}`)
  }
  childProcess.execSync(`rm -rf ${documentationPath}/*.html`)
  // copy the /public
  childProcess.execSync(`cp -R public ${documentationPath}/public`)
  // index.html
  const indexHTML = fs.readFileSync(path.join(__dirname, '/index.html'))
  const indexDoc = HTML.parse(indexHTML)
  HTML.applyImageSRI(indexDoc)
  const finalHTML = beautify(indexDoc.toString(), { indent_size: 2, space_in_empty_paren: true })
  fs.writeFileSync(path.join(documentationPath, '/index.html'), finalHTML)
  // generate dashboard and modules
  const modules = await scanModuleConfiguration(dashboardServerPath)
  if (modules.indexOf('@userdashboard/dashboard') === -1) {
    await generate(dashboardServerPath, '@userdashboard/dashboard')
  }
  for (const moduleName of modules) {
    console.log('generating module', moduleName)
    await generate(dashboardServerPath, moduleName)
  }
  // generate examples
  let i = 1
  while (true) {
    const examplePath = process.env[`EXAMPLE_DASHBOARD_SERVER_PATH${i}`]
    if (!examplePath) {
      console.log('no path')
      break
    }
    console.log('generating example', examplePath)
    const packageJSON = require(`${examplePath}/package.json`)
    await generate(examplePath, packageJSON.name)
    i++
  }
}

start()

async function generate (rootPath, moduleName) {
  await createDocumentation(rootPath, moduleName, documentationPath)
  const ui = await scanUIStructure(rootPath, moduleName, documentationPath)
  if (ui) {
    await createUIIndex(rootPath, moduleName, documentationPath, ui)
    await createUISitemap(rootPath, moduleName, documentationPath, ui)
    for (const location of ui.guest) {
      await createUIRoute(rootPath, moduleName, documentationPath, location)
    }
    for (const location of ui.user) {
      await createUIRoute(rootPath, moduleName, documentationPath, location)
    }
    for (const location of ui.administrator) {
      await createUIRoute(rootPath, moduleName, documentationPath, location)
    }
  }
  const api = await scanAPIStructure(rootPath, moduleName)
  if (api) {
    await createAPIIndex(rootPath, moduleName, documentationPath, api)
    for (const urlPath in api) {
      await createAPIRoute(rootPath, moduleName, documentationPath, api, urlPath)
    }
  }
  const env = await scanConfiguration(rootPath, moduleName)
  if (env) {
    await createConfiguration(rootPath, moduleName, documentationPath, env)
  }
}

async function scanUIStructure (rootPath, moduleName, documentationPath) {
  let uiPath, example
  switch (moduleName) {
    case '@userdashboard/dashboard':
      uiPath = ''
      break
    case '@userdashboard/organizations':
      uiPath = '/organizations'
      break
    case '@userdashboard/maxmind-geoip':
      uiPath = '/maxmind'
      break
    case '@userdashboard/stripe-connect':
      uiPath = '/connect'
      break
    case '@userdashboard/stripe-subscriptions':
      uiPath = '/subscriptions'
      break
    case 'example-web-app':
      uiPath = ''
      example = true
      break
    case 'example-subscription-web-app':
      uiPath = ''
      example = true
      break
  }
  const sitemap = {
    guest: [],
    user: [],
    administrator: [],
    examples: []
  }
  let sitemapFilePath = `${rootPath}/sitemap.txt`
  if (!fs.existsSync(sitemapFilePath)) {
    sitemapFilePath = `${rootPath}/node_modules/${moduleName}/sitemap.txt`
  }
  if (!fs.existsSync(sitemapFilePath)) {
    return sitemap
  }
  let sitemaptxt = fs.readFileSync(sitemapFilePath).toString()
  sitemaptxt = sitemaptxt.substring(sitemaptxt.indexOf('URL'))
  const lines = sitemaptxt.split('\n')
  for (const line of lines) {
    if (!line.startsWith('/') ||
      line.startsWith('/api/') ||
      line.startsWith('/webhooks/') ||
      line.startsWith('/public/') ||
      (line.indexOf('@userdashboard') > -1 && moduleName.indexOf('@userdashboard') === 0)) {
      console.log('skip1', line)
      continue
    }
    const fullscreen = line.indexOf('FULLSCREEN') > -1
    const guest = line.indexOf('GUEST') > -1
    const url = line.substring(0, line.indexOf(' '))
    if (url === '/' || url === '/home') {
      console.log('skip2', line)
      continue
    }
    let parentModule
    if (line.indexOf('@userdashboard/') > -1) {
      parentModule = line.substring(line.indexOf('@userdashboard'))
      parentModule = parentModule.substring(0, parentModule.indexOf(' '))
    } else if (!example) {
      parentModule = '@userdashboard/dashboard'
    }
    let screenshotPath = `/screenshots${url}`
    let pageURL = url
    if (pageURL === '/' ||
      pageURL === `/account${uiPath}` ||
      pageURL === `/administrator${uiPath}`) {
      pageURL += pageURL === '/' ? 'index' : '/index'
      screenshotPath += url === '/' ? 'index' : '/index'
    }
    let htmlFilePath = `${rootPath}/node_modules/${moduleName}/src/www${pageURL}.html`
    console.log(pageURL, 'map 1', htmlFilePath)
    if (!fs.existsSync(htmlFilePath)) {
      htmlFilePath = `${rootPath}/node_modules/${parentModule}/src/www${pageURL}.html`
      console.log(pageURL, 'map 2', htmlFilePath)
      if (!fs.existsSync(htmlFilePath)) {
        htmlFilePath = `${rootPath}/node_modules/${parentModule}/src/www${pageURL}/index.html`
        console.log(pageURL, 'map 3', htmlFilePath)
        if (!fs.existsSync(htmlFilePath)) {
          htmlFilePath = `${rootPath}/src/www${pageURL}.html`
          console.log(pageURL, 'map 4', htmlFilePath)
          if (!fs.existsSync(htmlFilePath)) {
            htmlFilePath = `${rootPath}/src/www${pageURL}/index.html`
            console.log(pageURL, 'map 5', htmlFilePath)
            if (!fs.existsSync(htmlFilePath)) {
              console.log(pageURL, 'map 6', htmlFilePath)
              htmlFilePath = `${rootPath}/node_modules/${moduleName}/src/www${pageURL}/index.html`
            }
          }
        }
      }
    }
    if (!fs.existsSync(htmlFilePath)) {
      console.log('no html file path', line, htmlFilePath)
      continue
    }
    const array = guest ? sitemap.guest : (pageURL.indexOf('/administrator') > -1 ? sitemap.administrator : sitemap.user)
    const html = fs.readFileSync(htmlFilePath).toString()
    let title = html.substring(html.indexOf('<title'))
    title = title.substring(title.indexOf('>') + 1)
    title = title.substring(0, title.indexOf('<'))
    if (title.indexOf('${') > -1) {
      title = title.substring(0, title.indexOf('.')) + 'id'
      title = title.replace('${', '#')
    }
    if (!fs.existsSync(`${documentationPath}${screenshotPath}`)) {
      array.push({
        object: 'route',
        htmlFilePath,
        url,
        title,
        html,
        guest,
        fullscreen
      })
      continue
    }
    const files = fs.readdirSync(`${documentationPath}${screenshotPath}`)
    let src
    for (const file of files) {
      if (file.indexOf('desktop') === -1 || file.indexOf('-en.png') === -1) {
        continue
      }
      if (file.indexOf('submit-form') > -1 || file.indexOf('complete') > -1) {
        src = `${screenshotPath}/${file}`
        if (example) {
          src = src.replace('/screenshots', `/screenshots/${moduleName}`)
        }
        break
      }
    }
    array.push({
      object: 'route',
      htmlFilePath,
      url,
      src,
      title,
      html,
      guest,
      fullscreen
    })
  }
  // add unmapped examples
  if (example) {
    const screenshotPath = `${documentationPath}/screenshots/${moduleName}/`
    if (fs.existsSync(screenshotPath)) {
      const folders = fs.readdirSync(screenshotPath)
      for (const folder of folders) {
        if (folder === 'account' || folder === 'administrator') {
          continue
        }
        const files = fs.readdirSync(`${documentationPath}/screenshots/${moduleName}/${folder}/`)
        let src
        for (const file of files) {
          if (file.indexOf('desktop') === -1 || file.indexOf('-en.png') === -1) {
            continue
          }
          if (file.indexOf('submit-form') > -1 || file.indexOf('complete') > -1) {
            src = `/screenshots/${moduleName}/${folder}/${file}`
            break
          }
        }
        sitemap.examples.push({
          object: 'route',
          htmlFilePath: '',
          url: '#',
          src,
          title: folder.charAt(0).toUpperCase() + folder.split('-').join(' ').substring(1)
        })
      }
    }
  }
  return sitemap
}

/**
 * scans an API folder for user and administrator routes and
 * extracts data from the accompanying .test.js file
 */
async function scanAPIStructure (rootPath, moduleName) {
  let apiPath, moduleFolder
  if (moduleName === '@userdashboard/dashboard') {
    apiPath = ''
    moduleFolder = '@userdashboard/dashboard'
  } else if (moduleName === 'organizations') {
    apiPath = 'organizations'
    moduleFolder = '@userdashboard/organizations'
  } else if (moduleName === '@userdashboard/maxmind-geoip') {
    apiPath = 'maxmind'
    moduleFolder = '@userdashboard/maxmind-geoip'
  } else if (moduleName === '@userdashboard/stripe-connect' || moduleName === '@userdashboard/stripe-subscriptions') {
    apiPath = moduleName.split('-')[1]
    moduleFolder = moduleName
  } else {
    apiPath = moduleName.split('/')[1]
    moduleFolder = moduleName
  }
  const userDir = path.join(rootPath, `node_modules/${moduleFolder}/src/www/api/user/${apiPath}`)
  const administratorDir = path.join(rootPath, `node_modules/${moduleFolder}/src/www/api/administrator/${apiPath}`)
  const files = []
  const userFiles = fs.existsSync(userDir) ? fs.readdirSync(userDir) : []
  const administratorFiles = fs.existsSync(administratorDir) ? fs.readdirSync(administratorDir) : []
  for (const file of userFiles) {
    files.push(userDir + '/' + file)
  }
  for (const file of administratorFiles) {
    files.push(administratorDir + '/' + file)
  }
  const index = {}
  for (const filePath of files) {
    if (!filePath.endsWith('.test.js')) {
      continue
    }
    const lines = fs.readFileSync(filePath).toString().split('\n')
    const structure = {}
    let currentArray, currentSegment, newFilePath
    for (const line of lines) {
      if (line.indexOf('describe(') === -1 && line.indexOf(' it(') === -1) {
        continue
      }
      if (line.indexOf('/api/') > -1) {
        newFilePath = line.substring(line.indexOf('/api'))
        newFilePath = newFilePath.substring(0, newFilePath.indexOf("'"))
        continue
      }
      if (!newFilePath) {
        break
      }
      if (line.indexOf('#GET') > -1 || line.indexOf('#POST') > -1 || line.indexOf('#PATCH') > -1 || line.indexOf('#DELETE') > -1) {
        continue
      }
      if (line.indexOf('#get') > -1 || line.indexOf('#post') > -1 || line.indexOf('#patch') > -1 || line.indexOf('#delete') > -1) {
        continue
      }
      if (line.indexOf('describe(') > -1) {
        if (line.indexOf('describe(\'exceptions') > -1) {
          currentSegment = 'exceptions'
          currentArray = structure.exceptions = {}
        } else if (line.indexOf('describe(\'receives') > -1) {
          currentArray = structure.receives = []
          currentSegment = 'receives'
        } else if (line.indexOf('describe(\'returns') > -1) {
          currentArray = structure.returns = []
          currentSegment = 'returns'
        } else if (line.indexOf('describe(\'configuration') > -1) {
          currentArray = structure.configuration = []
          currentSegment = 'configuration'
        } else if (line.indexOf('describe(\'redacts') > -1) {
          currentArray = structure.redacts = []
          currentSegment = 'redacts'
        } else {
          let type = line.substring(line.indexOf('describe(\'') + 10)
          type = type.substring(0, type.indexOf("'"))
          currentArray = structure[currentSegment][type] = []
        }
        continue
      }
      if (!currentArray || !currentArray.push) {
        continue
      }
      let description = line.substring(line.indexOf("it('") + 4)
      description = description.substring(0, description.indexOf("'"))
      currentArray.push(description)
    }
    if (!currentArray) {
      continue
    }
    const fileDescription = newFilePath
    let verb
    if (fileDescription.indexOf('create-') > -1) {
      verb = 'POST'
    } else if (fileDescription.indexOf('delete-') > -1) {
      verb = 'DELETE'
    } else if (fileDescription.indexOf('update-') > -1 || fileDescription.indexOf('set-') > -1 || fileDescription.indexOf('reset-') > -1) {
      verb = 'PATCH'
    } else {
      verb = 'GET'
    }
    index[fileDescription] = { verb, structure, fileDescription }
  }
  return index
}

/*
 * extracts environment variable configuration from data
 * within a project's /index.test.js
 */
async function scanConfiguration (rootPath, moduleName) {
  const filePath = path.join(rootPath, `node_modules/${moduleName}/index.test.js`)
  if (!fs.existsSync(filePath)) {
    return {}
  }
  let properties = fs.readFileSync(filePath).toString()
  properties = properties.substring(properties.indexOf('['))
  properties = properties.substring(0, properties.indexOf(']') + 1)
  let json = properties.split("'").join('"')
  const tags = [' camelCase', ' raw', ' noDefaultValue', ' defaultDescription', ' valueDescription', ' value', ' default', ' description']
  for (const tag of tags) {
    json = json.split(tag).join(` "${tag.trim()}"`)
  }
  const structure = JSON.parse(json)
  return structure
}

async function scanModuleConfiguration () {
  const packageJSON = require(`${dashboardServerPath}/package.json`)
  if (!packageJSON.dashboard || !packageJSON.dashboard.modules || !packageJSON.dashboard.modules.length) {
    return []
  }
  return packageJSON.dashboard.modules
}
