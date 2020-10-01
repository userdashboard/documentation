/**
 * The sitemaps are generated using CSS and HTML to create
 * a tree diagram.
 *
 * First the pages are indexed by scanning the nominated
 * folder's src/www folder for HTML spages.   The titles
 * are extracted from the page.  All page-accompanying
 * NodeJS files are parsed.  The navigation 'navbar*.html'
 * files are scanned after the pages.
 *
 * If a page is noncotigious it means it has no navbar
 * defined in its <HTML> tag so the page NodeJS and
 * HTML contents are checked to see if anything
 * redirects to the page.
 *
 * The screenshot for each route is selected from the
 * generated screenshots, prioritizing the form completion
 * and viewing screenshots.
 */

const beautify = require('js-beautify').html
const fs = require('fs')
const HTML = require('./html.js')
const path = require('path')
const template = fs.readFileSync('./ui-sitemap-template.html').toString()
let idNumber = 1
const pageIndex = {}
const navbars = []
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

module.exports = async (rootPath, moduleName, documentationPath, sitemap) => {
  let uiPath, title, exampleApp, srcPath
  switch (moduleName) {
    case '@userdashboard/dashboard':
      uiPath = ''
      title = 'Dashboard'
      srcPath = 'node_modules/@userdashboard/dashboard/src/www'
      break
    case '@userdashboard/organizations':
      uiPath = '/organizations'
      title = 'Organizations module'
      srcPath = 'node_modules/@userdashboard/organizations/src/www'
      break
    case '@userdashboard/maxmind-geoip':
      uiPath = '/maxmind'
      title = 'MaxMind GeoIP module'
      srcPath = 'node_modules/@userdashboard/maxmind-geoip/src/www'
      break
    case '@userdashboard/stripe-connect':
      uiPath = '/connect'
      title = 'Stripe Connect module'
      srcPath = 'node_modules/@userdashboard/stripe-connect/src/www'
      break
    case '@userdashboard/stripe-subscriptions':
      uiPath = '/subscriptions'
      title = 'Stripe Subscriptions module'
      srcPath = 'node_modules/@userdashboard/stripe-subscriptions/src/www'
      break
    case 'example-web-app':
      title = 'Example web app'
      exampleApp = true
      srcPath = 'src/www'
      break
    case 'example-subscription-web-app':
      title = 'Example subscription web app'
      exampleApp = true
      srcPath = 'src/www'
      break
  }

  for (const object of sitemap.guest) {
    if (object.htmlFilePath && object.htmlFilePath.indexOf(rootPath) > -1) {
      pageIndex[object.url] = object
    } else if (object.url === '/') {
      pageIndex[object.url] = object
    }
  }
  for (const object of sitemap.user) {
    if (object.htmlFilePath && object.htmlFilePath.indexOf(rootPath) > -1) {
      pageIndex[object.url] = object
    } else if (object.url === '/account' || object.url === `/account${uiPath}`) {
      pageIndex[object.url] = object
    }
  }
  for (const object of sitemap.administrator) {
    if (object.htmlFilePath && object.htmlFilePath.indexOf(rootPath) > -1) {
      pageIndex[object.url] = object
    } else if (object.url === '/administrator' || object.url === `/administrator${uiPath}`) {
      pageIndex[object.url] = object
    }
  }
  console.log('page index', Object.keys(pageIndex).join('\n'))
  console.log('navbars', navbars)
  scanNavigationBars(uiPath, `${rootPath}/${srcPath}`)
  if (exampleApp) {
    scanNavigationBars(uiPath, `${rootPath}/node_modules/@userdashboard/dashboard/src/www`)
    const packageJSON = require(`${rootPath}/package.json`)
    if (packageJSON && packageJSON.dashboard && packageJSON.dashboard.modules && packageJSON.dashboard.modules.length) {
      for (const module of packageJSON.dashboard.modules) {
        scanNavigationBars(uiPath, `${rootPath}/node_modules/${module}/src/www`)
      }
    }
  }
  const tree = mapTreeIndex(moduleName, exampleApp)
  const doc = HTML.parse(template)
  doc.getElementsByTagName('title')[0].child = [{
    node: 'text',
    text: `${title} sitemap`
  }]
  doc.getElementsByTagName('h1')[0].child = [{
    node: 'text',
    text: `${title} sitemap`
  }]
  const navbarTemplate = doc.getElementById('navbar')
  if (navbarTemplate) {
    doc.getElementById('navigation').child = navbarTemplate.child
    navbarTemplate.parentNode.removeChild(navbarTemplate)
  }
  console.log('rendering tree', JSON.stringify(tree, null, '  '))
  if (exampleApp) {
    const accountTree = tree['/']['/account']
    const administratorTree = tree['/']['/administrator']
    renderPath(doc, exampleApp, uiPath, accountTree, '/account', null, pageIndex, moduleName, exampleApp)
    renderPath(doc, exampleApp, uiPath, administratorTree, '/administrator', null, pageIndex, moduleName, exampleApp)
  } else if (moduleName === '@userdashboard/dashboard') {
    const userStem = '/account'
    const administratorStem = '/administrator'
    renderPath(doc, exampleApp, uiPath, tree['/']['/account'], userStem, null, pageIndex, moduleName)
    renderPath(doc, exampleApp, uiPath, tree['/']['/administrator'], administratorStem, null, pageIndex, moduleName)
  } else {
    const userStem = '/account' + uiPath
    const administratorStem = '/administrator' + uiPath
    renderPath(doc, exampleApp, uiPath, tree['/']['/account']['/account' + uiPath], userStem, null, pageIndex, moduleName)
    renderPath(doc, exampleApp, uiPath, tree['/']['/administrator']['/administrator' + uiPath], administratorStem, null, pageIndex, moduleName)
  }
  const emptyTags = doc.getElementsByTagName('ul')
  for (const tag of emptyTags) {
    if (!tag.child || !tag.child.length) {
      tag.parentNode.removeChild(tag)
    }
  }
  for (let i = 1, len = idNumber + 1; i < len; i++) {
    const list = doc.getElementById(`route-list-${i}`)
    if (list && (!list.child || !list.child.length)) {
      list.parentNode.removeChild(list)
    }
  }
  const html = beautify(doc.toString(), {
    indent_size: 2,
    space_in_empty_paren: true
  })
  const uiFile = moduleName.split('/').pop() + '-sitemap.html'
  console.log('writing ui file', uiFile)
  fs.writeFileSync(`${documentationPath}/${uiFile}`, html)
  for (const url in pageIndex) {
    pageIndex[url].html = ''
  }
}
function renderPath(doc, exampleApp, uiPath, node, urlPath, parentid, pageIndex, moduleName, exampleApp) {
  console.log('renderPath', urlPath, parentid, uiPath, parentid, moduleName, exampleApp)
  let pageInfo = pageIndex[urlPath] || pageIndex[urlPath + '/index'] || pageIndex[`${urlPath}/index.html`]
  if (!pageInfo) {
    if (urlPath === '/') {
      pageInfo = {
        object: 'route',
        urlPath: '/',
        title: 'Application home',
        screenshotPath: ''
      }
    } else {
      return console.log('exit 1', urlPath, pageIndex)
    }
  }
  if (urlPath !== '/' && urlPath !== '/account' && urlPath !== '/administrator' && pageInfo.htmlFilePath.indexOf(moduleName) === -1) {
    return console.log('exit 2', urlPath)
  }
  const route = {
    object: 'route',
    id: idNumber++,
    urlPath: pageInfo.url,
    title: pageInfo.title,
    screenshotPath: pageInfo.src
  }
  if (exampleApp) {
    route.urlPath = '#'
  }
  let target
  if (parentid) {
    console.log(urlPath, 'parent', parentid)
    target = `route-list-${parentid}`
  } else {
    console.log(urlPath, 'no parent')
    target = 'sitemap'
  }
  if (!doc.getElementById(`route-list-${route.id}`)) {
    console.log('rendering route', route, target)
    HTML.renderTemplate(doc, route, 'route-template', target)
  } else {
    console.log('element already exists', route)
  }
  if (!exampleApp && (urlPath === '/' || urlPath === '/home')) {
    const brokenLink = doc.getElementById(`link-${route.id}`)
    if (brokenLink && brokenLink.parentNode) {
      brokenLink.parentNode.removeChild(brokenLink)
    }
    const emptyContainer = doc.getElementById(`route-container-${route.id}`)
    if (emptyContainer && emptyContainer.parentNode) {
      emptyContainer.parentNode.removeChild(emptyContainer)
    }
  }
  if (!exampleApp && uiPath && (urlPath === '/account' || urlPath === '/administrator')) {
    const brokenLink = doc.getElementById(`link-${route.id}`)
    if (brokenLink && brokenLink.parentNode) {
      brokenLink.parentNode.removeChild(brokenLink)
    }
  }
  const nodeKeys = node ? Object.keys(node) : null
  if (!nodeKeys || !nodeKeys.length) {
    return console.log('no nested urls', urlPath)
  }
  nodeKeys.sort(indexHomeThenDashboard)
  console.log('nested urls', urlPath, nodeKeys)
  for (const nestedURL of nodeKeys) {
    renderPath(doc, exampleApp, uiPath, node[nestedURL], nestedURL, route.id, pageIndex, moduleName, exampleApp)
  }
}

function mapTreeIndex(moduleName, exampleApp) {
  console.log('map tree index', moduleName, exampleApp)
  const tree = {
    '/': {}
  }
  // first map navigation bars and their links
  for (const navbar of navbars) {
    const pathParts = navbar.urlPath.substring(1).split('/')
    let lastNode = tree['/']
    let cumulative = ''
    for (const part of pathParts) {
      cumulative += '/' + part
      if (!lastNode[cumulative]) {
        lastNode[cumulative] = {}
      }
      lastNode = lastNode[cumulative]
    }
    for (const link of navbar.links) {
      lastNode[link.urlPath] = {}
    }
  }
  console.log('map part one', tree, navbars)
  // map the noncontigious pages
  for (const isolatedPath in pageIndex) {
    if (isolatedPath === '/' || (!exampleApp && isolatedPath === '/home')) {
      continue
    }
    const isolatedPage = pageIndex[isolatedPath]
    if (!isolatedPage.detached) {
      continue
    }
    const pathParts = isolatedPage.urlPath.substring(1).split('/')
    let lastNode = tree['/']
    let cumulative = ''
    for (const part of pathParts) {
      cumulative += '/' + part
      if (!lastNode[cumulative]) {
        lastNode[cumulative] = {}
      }
      lastNode = lastNode[cumulative]
    }
  }
  // remap noncontigious files if another page redirects to it
  for (const isolatedPath in pageIndex) {
    const isolatedPage = pageIndex[isolatedPath]
    if (!isolatedPage.detached ||
      isolatedPath === '/' ||
      isolatedPath === '/home') {
      continue
    }
    // try and find a better parent
    for (const parentPath in pageIndex) {
      if (parentPath === isolatedPath) {
        continue
      }
      const possibleParentPage = pageIndex[parentPath]
      if (possibleParentPage.urlPath === '/' ||
        possibleParentPage.urlPath === '/home' ||
        possibleParentPage.urlPath === '/account/signin' ||
        possibleParentPage.urlPath === '/account/register') {
        continue
      }
      let matchHTML
      if (possibleParentPage.pageHTML) {
        if (possibleParentPage.pageHTML.indexOf('</head>') > -1) {
          let pageHeader = possibleParentPage.pageHTML.substring(0, possibleParentPage.pageHTML.indexOf('</head>'))
          pageHeader = pageHeader.substring(pageHeader.indexOf('<head>'))
          const header = HTML.parse(pageHeader)
          const metaTags = header.getElementsByTagName('meta')
          if (metaTags && metaTags.length) {
            for (const metaTag of metaTags) {
              if (!metaTag.attr || metaTag.attr['http-equiv'] !== 'refresh') {
                continue
              }
              matchHTML = metaTag.attr.content.indexOf(isolatedPath) > -1
            }
          }
        }
      }
      let matchJS
      if (!matchHTML && possibleParentPage.pageJS) {
        let redirect = possibleParentPage.pageJS.substring(possibleParentPage.pageJS.indexOf('res.writeHead(302, {'))
        redirect = redirect.substring(0, redirect.indexOf('res.end()'))
        matchJS = redirect && redirect.indexOf(isolatedPath) > -1
      }
      if (!matchHTML && !matchJS) {
        continue
      }
      const parentPathParts = parentPath.substring(1).split('/')
      let lastNode = tree['/']
      let cumulative = ''
      for (const part of parentPathParts) {
        cumulative += '/' + part
        if (!lastNode[cumulative]) {
          break
        }
        lastNode = lastNode[cumulative]
      }
      deleteTreePath(tree, isolatedPath)
      lastNode[isolatedPath] = {}
    }
  }
  // merge the 'single' pages with their 'plural' counterparts
  for (const pluralPath in pageIndex) {
    if (!pluralPath.endsWith('s')) {
      continue
    }
    const singlePath = pluralPath.substring(0, pluralPath.length - 1)
    if (!pageIndex[singlePath]) {
      continue
    }
    let parentPath = pluralPath.substring(0, pluralPath.lastIndexOf('/'))
    if (parentPath.indexOf(`/${moduleName}/`)) {
      parentPath = parentPath.replace(`/${moduleName}/`, '')
    }
    const parentPathParts = parentPath.substring(1).split('/')
    let parentNode = tree['/']
    let cumulative = ''
    for (const part of parentPathParts) {
      cumulative += '/' + part
      if (!parentNode || !parentNode[cumulative]) {
        console.log(cumulative, parentNode)
        throw new Error('huh')
      }
      parentNode = parentNode[cumulative]
    }
    const singleNode = parentNode[singlePath]
    deleteTreePath(tree, singlePath)
    parentNode[pluralPath] = parentNode[singlePath.replace(singlePath, pluralPath)] || {}
    parentNode[pluralPath][singlePath] = singleNode
  }
  return tree
}

function deleteTreePath(tree, path) {
  function scan(node) {
    for (const key in node) {
      if (key === path) {
        delete (node[key])
        break
      }
      if (node[key] && Object.keys(node[key]).length) {
        scan(node[key])
      }
    }
  }
  scan(tree)
}

function scanNavigationBars(uiPath, directoryPath) {
  console.log('scanning navbars', uiPath,  directoryPath)
  if (!fs.existsSync(directoryPath)) {
    console.log('no navbar path', directoryPath)
    return
  }
  const allFiles = fs.readdirSync(directoryPath)
  const navbarFiles = []
  for (const file of allFiles) {
    if (file.startsWith('navbar') && file.endsWith('.html')) {
      navbarFiles.push(file)
    }
  }
  navbarFiles.sort(navbarThenPluralThenSingles)
  for (const filename of navbarFiles) {
    const filePath = path.join(directoryPath, filename)
    let urlPath = filePath.substring(filePath.indexOf('/src/www') + '/src/www'.length)
    urlPath = urlPath.replace('navbar-', '')
    urlPath = urlPath.substring(0, urlPath.length - 5)
    if (urlPath.endsWith('/navbar')) {
      urlPath = urlPath.substring(0, urlPath.length - '/navbar'.length)
    }
    if (urlPath === '/account/account' || urlPath === '/administrator/administrator') {
      urlPath = urlPath.substring(0, urlPath.lastIndexOf('/'))
    }
    let title
    if (!pageIndex[urlPath]) {
      title = urlPath.split('/').pop()
      title = title.substring(0, 1).toUpperCase() + title.substring(1)
    } else {
      title = pageIndex[urlPath].title
      if (title.startsWith('View ')) {
        title = title.substring('View '.length)
      }
      for (const letter of alphabet) {
        title = title.split(letter).join(` ${letter}`)
      }
      title = title.trim()
      if (title.length) {
        title = title.substring(0, 1).toUpperCase() + title.substring(1)
      }
    }
    let screenshotFolder = path.join(__dirname, 'screenshots' + urlPath)
    if (urlPath === `/account${uiPath}` || urlPath === `/administrator${uiPath}`) {
      screenshotFolder += '/index'
    }
    let screenshotPath
    if (fs.existsSync(screenshotFolder)) {
      const screenshots = fs.readdirSync(screenshotFolder)
      for (const screenshot of screenshots) {
        if (!screenshot.endsWith('desktop-en.png')) {
          continue
        }
        if (screenshot.indexOf('submit-form') > -1 || screenshot.indexOf('complete') > -1) {
          screenshotPath = screenshot
          break
        }
      }
    }
    const links = parseNavigationLinks(uiPath, directoryPath, filename, urlPath)
    const object = { object: 'route', urlPath, links, title, screenshotPath: `/screenshots${urlPath}/${screenshotPath}` }
    navbars.push(object)
  }
  for (const filename of allFiles) {
    if (filename === 'api' || filename === 'webhooks' || filename.indexOf('.') > -1) {
      continue
    }
    const filePath = path.join(directoryPath, filename)
    const fileStat = fs.statSync(filePath)
    if (fileStat.isDirectory()) {
      scanNavigationBars(uiPath, filePath)
    }
  }
}

function parseNavigationLinks(uiPath, directoryPath, filename, urlPath) {
  const filePath = path.join(directoryPath, filename)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const navbarHTML = fs.readFileSync(filePath).toString()
  if (!navbarHTML || !navbarHTML.length) {
    return []
  }
  const navigationLinks = HTML.parse(`<div>${navbarHTML}</div>`).getElementsByTagName('a')
  const links = []
  for (const link of navigationLinks) {
    if (!link.attr || !link.attr.href) {
      continue
    }
    if (link.attr.href === '/home' ||
      link.attr.href === '/account' ||
      link.attr.href === `/account${uiPath}` ||
      link.attr.href === '/administrator' ||
      link.attr.href === `/administrator${uiPath}` ||
      link.attr.href === `${urlPath}s`) {
      continue
    }
    let linkPath = link.attr.href
    const question = linkPath.indexOf('?')
    if (question > 0) {
      linkPath = linkPath.substring(0, question)
    }
    if (!pageIndex[linkPath] || linkPath === urlPath) {
      continue
    }
    let title = pageIndex[linkPath].title
    if (title.startsWith('View ')) {
      title = title.substring('View '.length)
    }
    for (const letter of alphabet) {
      title = title.split(letter).join(` ${letter}`)
    }
    title = title.trim()
    if (title.length) {
      title = title.substring(0, 1).toUpperCase() + title.substring(1)
    }
    const screenshotPath = pageIndex[linkPath].screenshotPath
    const id = pageIndex[linkPath].id
    const route = { object: 'route', urlPath: linkPath, title, id, links: [], screenshotPath }
    links.push(route)
  }
  return links
}

function navbarThenPluralThenSingles(a, b) {
  if (a === 'navbar.html') {
    return -1
  }
  if (b === 'navbar.html') {
    return 1
  }
  if (a.endsWith('s.html')) {
    return -1
  }
  if (b.endsWith('s.html')) {
    return 1
  }
}

function indexHomeThenDashboard(a, b) {
  if (a === '/home' || a === '/') {
    return 1
  }
  if (b === '/home' || b === '/') {
    return -1
  }
  return a < b ? 1 : 1
}
