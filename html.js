const crypto = require('crypto')
const fs = require('fs')
const HTML = require('@userdashboard/dashboard/src/html.js')
const path = require('path')
const documentationPath = process.env.DOCUMENTATION_PATH || process.argv[2]
const originalParse = HTML.parse
module.exports = HTML
const cache = {}

module.exports.parse = (fileOrHTML) => {
  const copy = '' + fileOrHTML
  const doc = originalParse(copy)
  const css1 = doc.getElementsByTagName('style') || []
  const css2 = doc.getElementsByTagName('link') || []
  const css = [].concat(css1).concat(css2)
  if (css && css.length) {
    for (const tag of css) {
      if (!tag.attr) {
        continue
      }
      if (!tag.attr.href || !tag.attr.href.startsWith('/')) {
        continue
      }
      const newPath = path.join(documentationPath, tag.attr.href)
      if (!cache[newPath]) {
        const cssFile = fs.readFileSync(newPath)
        cache[newPath] = sri(cssFile)
      }
      tag.attr.integrity = cache[newPath]
      tag.attr.crossorigin = 'anonymous'
    }
  }
  const js = doc.getElementsByTagName('script')
  if (js && js.length) {
    for (const tag of js) {
      if (!tag.attr || !tag.attr.src || !tag.attr.src.startsWith('/')) {
        continue
      }
      const newPath = path.join(documentationPath, tag.attr.src)
      if (!cache[newPath]) {
        const jsFile = fs.readFileSync(newPath)
        cache[newPath] = sri(jsFile)
      }
      tag.attr.integrity = cache[newPath]
      tag.attr.crossorigin = 'anonymous'
    }
  }
  const img = doc.getElementsByTagName('img')
  if (img && img.length) {
    for (const tag of img) {
      if (!tag.attr || !tag.attr.src || !tag.attr.src.endsWith('.svg')) {
        continue
      }
      if (tag.attr.src.indexOf('://') > -1) {
        tag.attr.src = tag.attr.src.split('://')[1]
        tag.attr.src = tag.attr.src.substring(tag.attr.src.indexOf('/'))
      }
      const newPath = path.join(documentationPath, tag.attr.src)
      if (!cache[newPath]) {
        const imgFile = fs.readFileSync(newPath)
        cache[newPath] = sri(imgFile)
      }
      tag.attr.integrity = cache[newPath]
      tag.attr.crossorigin = 'anonymous'
    }
  }
  let headings = [].concat(doc.getElementsByTagName('h1') || [])
  headings = headings.concat(doc.getElementsByTagName('h2') || [])
  headings = headings.concat(doc.getElementsByTagName('h3') || [])
  if (headings && headings.length) {
    for (const heading of headings) {
      heading.attr = heading.attr || {}
      if (heading.attr.id) {
        continue
      }
      if (heading.child && heading.child.length && heading.child[0].text) {
        heading.attr.id = heading.child[0].text.split(' ').join('-').toLowerCase()
      }
    }
  }
  return doc
}

module.exports.applyImageSRI = (doc) => {
  const img = doc.getElementsByTagName('img')
  if (img && img.length) {
    for (const tag of img) {
      if (!tag.attr || !tag.attr.src) {
        continue
      }
      if (!tag.attr.src.endsWith('.png') && !tag.attr.src.endsWith('.svg')) {
        continue
      }
      if (tag.attr.src.indexOf('://') > -1) {
        tag.attr.src = tag.attr.src.split('://')[1]
        tag.attr.src = tag.attr.src.substring(tag.attr.src.indexOf('/'))
      }
      const newPath = path.join(documentationPath, tag.attr.src)
      if (!cache[newPath]) {
        const imgFile = fs.readFileSync(newPath)
        cache[newPath] = sri(imgFile)
      }
      tag.attr.integrity = cache[newPath]
      tag.attr.crossorigin = 'anonymous'
    }
  }
  return doc
}

function sri(buffer) {
  const hash = crypto.createHash('sha384').update(buffer, 'binary').digest('base64').replace(/=+$/, '')
  return 'sha384-' + hash
}
