const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const path = require('path')
const template = fs.readFileSync('./ui-route-template.html').toString()

module.exports = async (rootPath, moduleName, documentationPath, page) => {
  let embeddedPath
  let moduleTitle
  if (moduleName === '@userdashboard/dashboard') {
    moduleTitle = 'Dashboard'
    embeddedPath = ''
  } else if (moduleName === '@userdashboard/organizations') {
    moduleTitle = 'the Organizations module'
    embeddedPath = '/organizations'
  } else if (moduleName === '@userdashboard/maxmind-geoip') {
    moduleTitle = 'the MaxMind GeoIP module'
  } else if (moduleName === '@userdashboard/stripe-connect') {
    moduleTitle = 'the Stripe Connect module'
    embeddedPath = '/connect'
  } else if (moduleName === '@userdashboard/stripe-subscriptions') {
    moduleTitle = 'the Stripe Subscriptions module'
    embeddedPath = '/subscriptions'
  }
  let pageTitle = page.title
  if (pageTitle.indexOf('${') > -1) {
    pageTitle = pageTitle.substring(0, pageTitle.lastIndexOf('.'))
    pageTitle = pageTitle.replace('${', '')
  }
  const folderName = page.url.split('/').pop()
  const administrator = page.url.indexOf('/administrator') > -1
  const imagePath = `screenshots/${administrator ? 'administrator' : 'account'}${embeddedPath}/${folderName}/`
  const screenshotPath = path.join(documentationPath, imagePath)
  if (!fs.existsSync(screenshotPath)) {
    return
  }
  const screenshots = fs.readdirSync(screenshotPath)
  const doc = HTML.parse(template)
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: moduleTitle.replace('the ', '').replace(' module', '') + ` UI explorer`
  }]
  doc.getElementById('title').child = [{
    node: 'text',
    text: pageTitle
  }]
  doc.getElementsByTagName('title')[0].child = [{
    node: 'text',
    text: `"${pageTitle}" documentation for ${moduleTitle}`
  }]
  const navbarTemplate = doc.getElementById('navbar')
  doc.getElementById('navigation').child = navbarTemplate.child
  navbarTemplate.parentNode.removeChild(navbarTemplate)
  const screenshotData = []
  for (const screenshot of screenshots) {
    if (screenshot.indexOf('desktop-en.png') === -1) {
      continue
    }
    const filenameParts = screenshot.split('-')
    let screenshotDescription = ''
    for (const part of filenameParts) {
      if (part === 'desktop') {
        break
      }
      if (screenshotDescription === '') {
        screenshotDescription = part + '.  '
        continue
      }
      screenshotDescription += ' ' + part.charAt(0).toUpperCase() + part.substring(1)
    }
    screenshotDescription = screenshotDescription.trim()
    screenshotData.push({
      object: 'screenshot',
      urlPath: `/${imagePath}${screenshot}`,
      description: screenshotDescription.trim()
    })
  }
  if (screenshotData && screenshotData.length) {
    HTML.renderList(doc, screenshotData, 'screenshot-template', 'screenshots')
    HTML.applyImageSRI(doc)
  }
  let htmlPath = `${administrator ? 'administrator' : 'account'}${embeddedPath}`
  htmlPath = path.join(documentationPath, htmlPath)
  createFolderSync(htmlPath, documentationPath)
  const html = beautify(doc.toString(), { indent_size: 2, space_in_empty_paren: true })
  fs.writeFileSync(`${htmlPath}/${folderName}.html`, html)
  console.log('writing UI route file', `${htmlPath}/${folderName}.html`)
}

function createFolderSync(path, documentationPath) {
  const nested = path.substring(documentationPath.length)
  const nestedParts = nested.split('/')
  let nestedPath = documentationPath
  for (const part of nestedParts) {
    nestedPath += `/${part}`
    if (!fs.existsSync(nestedPath)) {
      fs.mkdirSync(nestedPath)
    }
  }
}
