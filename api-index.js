const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const template = fs.readFileSync('./api-index-template.html').toString()

module.exports = async (rootPath, moduleName, documentationPath, api) => {
  let title
  if (moduleName === '@userdashboard/dashboard') {
    title = 'Dashboard'
  } else if (moduleName === '@userdashboard/organizations') {
    title = 'Organizations module'
  } else if (moduleName === '@userdashboard/maxmind-geoip') {
    title = 'MaxMind GeoIP module'
  } else if (moduleName === '@userdashboard/stripe-connect') {
    title = 'Stripe Connect module'
  } else if (moduleName === '@userdashboard/stripe-subscriptions') {
    title = 'Stripe Subscriptions module'
  }
  const doc = HTML.parse(template)
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: `${title} API index`
  }]
  doc.getElementsByTagName('title')[0].child = [{
    node: 'text',
    text: `${title} API index`
  }]
  const navbarTemplate = doc.getElementById('navbar')
  if (navbarTemplate) {
    doc.getElementById('navigation').child = navbarTemplate.child
    navbarTemplate.parentNode.removeChild(navbarTemplate)
  }
  const userRoutes = []
  const administratorRoutes = []
  for (const url in api) {
    let nodejs = 'global' + url.split('/').join('.')
    const parts = nodejs.split('.').pop().split('-')
    nodejs = nodejs.substring(0, nodejs.lastIndexOf('.') + 1)
    for (const i in parts) {
      nodejs += parts[i].charAt(0).toUpperCase() + parts[i].substring(1)
    }
    const urlParameters = []
    const postParameters = []
    if (api[url].structure.receives && api[url].structure.receives.length) {
      for (const parameter of api[url].structure.receives) {
        let truncated = parameter
        if (truncated.indexOf(' (') > -1) {
          truncated = truncated.substring(0, truncated.indexOf(' ('))
        }
        if (parameter.indexOf('posted') > -1) {
          postParameters.push({
            object: 'parameter',
            name: truncated.substring(truncated.lastIndexOf(' ') + 1)
          })
        } else {
          urlParameters.push({
            object: 'parameter',
            name: truncated.substring(truncated.lastIndexOf(' ') + 1)
          })
        }
      }
    }
    urlParameters.sort()
    postParameters.sort()
    const data = url.indexOf('/administrator/') > -1 ? administratorRoutes : userRoutes
    data.push({
      object: 'route',
      id: administratorRoutes.length + userRoutes.length,
      verb: api[url].verb,
      nodejs,
      url,
      urlParameters,
      postParameters
    })
  }
  const removeList = []
  if (userRoutes && userRoutes.length) {
    HTML.renderList(doc, userRoutes, 'route-row-template', 'user-routes-table')
  } else {
    removeList.push('user-container')
  }
  if (administratorRoutes && administratorRoutes.length) {
    HTML.renderTable(doc, administratorRoutes, 'route-row-template', 'administrator-routes-table')
  } else {
    removeList.push('administrator-container')
  }
  for (const route of userRoutes.concat(administratorRoutes)) {
    if (route.urlParameters && route.urlParameters.length) {
      route.urlParameters.sort((a, b) => {
        return a.name < b.name ? -1 : 1
      })
      HTML.renderList(doc, route.urlParameters, 'parameter-item-template', `url-parameters-${route.id}`)
    } else {
      removeList.push(`url-container-${route.id}`)
    }
    if (route.postParameters && route.postParameters.length) {
      route.postParameters.sort((a, b) => {
        return a.name < b.name ? -1 : 1
      })
      HTML.renderList(doc, route.postParameters, 'parameter-item-template', `post-parameters-${route.id}`)
    } else {
      removeList.push(`post-container-${route.id}`)
    }
  }
  for (const id of removeList) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  const html = beautify(doc.toString(), { indent_size: 2, space_in_empty_paren: true })
  const apiFile = moduleName.split('/').pop() + '-api.html'
  console.log('writing API index file', apiFile)
  fs.writeFileSync(`${documentationPath}/${apiFile}`, html)
}
