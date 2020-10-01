const beautify = require('js-beautify').html
const fs = require('fs')
const Remarkable = require('remarkable')
const HTML = require('./html.js')
const path = require('path')
const template = fs.readFileSync('./documentation-template.html').toString()

module.exports = (rootPath, moduleName, documentationPath) => {
  const md = new Remarkable.Remarkable()
  let filePath
  if (moduleName.startsWith('@userdashboard')) {
    filePath = path.join(rootPath, `/node_modules/${moduleName}/readme.md`)
  } else {
    filePath = path.join(rootPath, '../readme.md')
  }
  const text = fs.readFileSync(filePath).toString()
  const merged = template.replace('<title></title>', '<title>' + formatTitle(filePath) + '</title>').replace('<div class="content"></div>', `<div class="content">
      ${md.render(text)}
    </div>`)
  const doc = HTML.parse(merged)
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: formatTitle(filePath)
  }]
  const navbarTemplate = doc.getElementById('navbar')
  doc.getElementById('navigation').child = navbarTemplate.child
  navbarTemplate.parentNode.removeChild(navbarTemplate)
  const codeTags = doc.getElementsByTagName('code')
  if (codeTags && codeTags.length) {
    for (const tag of codeTags) {
      tag.setAttribute('data-language', 'js')
    }
  }
  const html = beautify(doc.toString(), { indent_size: 2, space_in_empty_paren: true })
  const filename = formatFileName(filePath)
  fs.writeFileSync(`${documentationPath}/${filename}`, html)
  console.log('writing documentation file', filename)
}

function formatTitle(filePath) {
  if (filePath.indexOf('/dashboard/') > -1) {
    return 'Dashboard documentation'
  } else if (filePath.indexOf('/stripe-connect/') > -1) {
    return 'Stripe Connect module documentation'
  } else if (filePath.indexOf('/stripe-subscriptions/') > -1) {
    return 'Stripe Subscriptions module documentation'
  } else if (filePath.indexOf('/maxmind-geoip/') > -1) {
    return 'MaxMind GeoIP module documentation'
  } else if (filePath.indexOf('/organizations/') > -1) {
    return 'Organizations module documentation'
  } else if (filePath.indexOf('/example-web-app') > -1) {
    return 'Example web app'
  } else if (filePath.indexOf('example-subscription-web-app')) {
    return 'Example subscription web app'
  }
}

function formatFileName(filePath) {
  if (filePath.indexOf('/dashboard/') > -1) {
    return 'dashboard.html'
  } else if (filePath.indexOf('/stripe-connect/') > -1) {
    return 'stripe-connect-module.html'
  } else if (filePath.indexOf('/stripe-subscriptions/') > -1) {
    return 'stripe-subscriptions-module.html'
  } else if (filePath.indexOf('/maxmind-geoip/') > -1) {
    return 'maxmind-geoip-module.html'
  } else if (filePath.indexOf('/organizations/') > -1) {
    return 'organizations-module.html'
  } else if (filePath.indexOf('/example-web-app') > -1) {
    return 'example-web-app.html'
  } else if (filePath.indexOf('example-subscription-web-app')) {
    return 'example-subscription-web-app.html'
  }
  return filePath
}
