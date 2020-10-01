const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const template = fs.readFileSync('./configuration-template.html').toString()

module.exports = (rootPath, moduleName, documentationPath, properties) => {
  if (!properties || !properties.length) {
    return
  }
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
  const sorted = [].concat(properties)
  sorted.sort((a, b) => {
    return a.raw > b.raw ? 1 : -1
  })
  const data = []
  for (const property of sorted) {
    const description = property.description
    const unset = property.default || ''
    let value = property.value || ''
    if (value.indexOf(',') > -1) {
      value = value.split(',').join(', ')
    }
    data.push({
      object: 'variable',
      name: property.raw,
      description,
      default: unset,
      value
    })
  }
  if (!data.length) {
    return
  }
  const doc = HTML.parse(template)
  doc.getElementsByTagName('title')[0].child = [{
    node: 'text',
    text: `${title} configuration`
  }]
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: `${title} configuration`
  }]
  const navbarTemplate = doc.getElementById('navbar')
  doc.getElementById('navigation').child = navbarTemplate.child
  navbarTemplate.parentNode.removeChild(navbarTemplate)
  HTML.renderList(doc, data, 'variable-row-template', 'variables-table')
  const html = beautify(doc.toString(), { indent_size: 2, space_in_empty_paren: true })
  const configurationFile = moduleName.split('/').pop() + '-configuration.html'
  fs.writeFileSync(`${documentationPath}/${configurationFile}`, html)
  console.log('writing configuration file', configurationFile)
}
