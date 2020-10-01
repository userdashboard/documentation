const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const template = fs.readFileSync('./ui-index-template.html').toString()

module.exports = async (rootPath, moduleName, documentationPath, sitemap) => {
  let title
  switch (moduleName) {
    case '@userdashboard/dashboard':
      title = 'Dashboard'
      break
    case '@userdashboard/maxmind-geoip':
      title = 'Dashboard'
      break
    case '@userdashboard/organizations':
      title = 'Organizations module'
      break
    case '@userdashboard/maxmind-geoip':
      title = 'MaxMind GeoIP module'
      break
    case '@userdashboard/stripe-connect':
      title = 'Stripe Connect module'
      break
    case '@userdashboard/stripe-subscriptions':
      title = 'Stripe Subscriptions module'
      break
    case 'example-web-app':
      title = 'Example web app'
      break
    case 'example-subscription-web-app':
      title = 'Example subscription web app'
      break
  }
  const doc = HTML.parse(template)
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: `${title} UI index`
  }]
  doc.getElementsByTagName('title')[0].child = [{
    node: 'text',
    text: `${title} UI index`
  }]
  const navbarTemplate = doc.getElementById('navbar')
  if (navbarTemplate) {
    doc.getElementById('navigation').child = navbarTemplate.child
    navbarTemplate.parentNode.removeChild(navbarTemplate)
  }
  if (sitemap.examples && sitemap.examples.length) {
    HTML.renderList(doc, sitemap.examples, 'route-template', 'example-routes-list')
  } else {
    const container = doc.getElementById('example-container')
    container.parentNode.removeChild(container)
  }
  if (sitemap.guest && sitemap.guest.length) {
    HTML.renderList(doc, sitemap.guest, 'route-template', 'guest-routes-list')
  } else {
    const container = doc.getElementById('guest-container')
    container.parentNode.removeChild(container)
  }
  if (sitemap.user && sitemap.user.length) {
    HTML.renderList(doc, sitemap.user, 'route-template', 'user-routes-list')
  } else {
    const container = doc.getElementById('user-container')
    container.parentNode.removeChild(container)
  }
  if (sitemap.administrator && sitemap.administrator.length) {
    HTML.renderList(doc, sitemap.administrator, 'route-template', 'administrator-routes-list')
  } else {
    const container = doc.getElementById('administrator-container')
    container.parentNode.removeChild(container)
  }
  HTML.applyImageSRI(doc)
  const html = beautify(doc.toString(), {
    indent_size: 2,
    space_in_empty_paren: true
  })
  const uiFile = moduleName.split('/').pop() + '-ui.html'
  console.log('writing ui index', `${documentationPath}/${uiFile}`)
  fs.writeFileSync(`${documentationPath}/${uiFile}`, html)
}
