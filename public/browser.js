var language = 'en'
var device = 'desktop'

window.onload = function () {
  // disable modal views on screenshots for small screens
  if (screen.width <= 800) {
    var img = document.getElementsByTagName('img')
    var a = document.getElementsByTagName('a')
    for (var i = 0, len = img.length; i < len; i++){
      img[i]._waMediaBoxBound = true
    }
    for (i = 0, len = a.length; i < len; i++) {
      a[i]._waMediaBoxBound = true
    }
  }
  // on developer pages with code samples the code is highlighted
  var preTags = document.getElementsByTagName('pre')
  if (preTags && preTags.length) {
    for (var i = 0, len = preTags.length; i < len; i++) {
      var doc = preTags[i].firstElementChild.innerHTML
      doc = doc.split('&lt;').join('<')
      doc = doc.split('&gt;').join('>')
      doc = doc.split('&amp;').join('&')
      var language = preTags[i].firstElementChild.getAttribute('data-language')
      var highlighted
      if (!language || language === 'text') {
        highlighted = {
          value: doc
        }
      } else {
        highlighted = window.hljs.highlight(language, doc)
      }
      preTags[i].firstElementChild.innerHTML = highlighted.value
    }
  }
  // on pages with screenshot sequences links are added to switch
  // between different device renderings and some glue for the lightbox
  var screenshotElements = document.getElementsByClassName('desktop')
  if (screenshotElements && screenshotElements.length) {
    for (i = 0, len = screenshotElements.length; i < len; i++) {
      var screenshots = screenshotElements[i]
      if (!screenshots) {
        continue
      }
      var images = screenshots.getElementsByTagName('img')
      for (var j = 0, len = images.length; j < len; j++) {
        var image = images[j]
        if (!image.hasAttribute('data-src')) {
          image.setAttribute('data-src', image.src)
        }
        window.WAMediaBox.bind(image)
      }
      if (i > 0) {
        continue
      }
      var desktop = document.createElement('li')
      desktop.innerHTML = 'Computer'
      desktop.device = 'desktop'
      desktop.onclick = setScreenshotDevice
      var largeTablet = document.createElement('li')
      largeTablet.innerHTML = 'Large tablet'
      largeTablet.onclick = setScreenshotDevice
      largeTablet.device = 'ipad-pro'
      var smallTablet = document.createElement('li')
      smallTablet.innerHTML = 'Small tablet'
      smallTablet.onclick = setScreenshotDevice
      smallTablet.device = 'ipad-mini'
      var largePhone = document.createElement('li')
      largePhone.innerHTML = 'Large phone'
      largePhone.onclick = setScreenshotDevice
      largePhone.device = 'pixel-2-xl'
      var smallPhone = document.createElement('li')
      smallPhone.innerHTML = 'Small phone'
      smallPhone.onclick = setScreenshotDevice
      smallPhone.device = 'iphone-se'
      var devices = document.createElement('ul')
      devices.className = 'devices'
      var none = document.createElement('li')
      none.innerHTML = 'No screenshots'
      none.onclick = setNoScreenshot
      none.className = 'current'
      desktop.className = ''
      devices.appendChild(none)
      devices.appendChild(desktop)
      devices.appendChild(largeTablet)
      devices.appendChild(smallTablet)
      devices.appendChild(largePhone)
      devices.appendChild(smallPhone)
      // var english = document.createElement('li')
      // english.innerHTML = 'English'
      // english.className = 'current'
      // english.onclick = setScreenshotLanguage
      // english.language = 'en'
      // var spanish = document.createElement('li')
      // spanish.innerHTML = 'Spanish'
      // spanish.onclick = setScreenshotLanguage
      // spanish.language = 'es'
      // var afrikaans = document.createElement('li')
      // afrikaans.innerHTML = 'Afrikaans'
      // afrikaans.onclick = setScreenshotLanguage
      // afrikaans.language = 'af'
      // var bulgarian = document.createElement('li')
      // bulgarian.innerHTML = 'български'
      // bulgarian.onclick = setScreenshotLanguage
      // bulgarian.language = 'bg'
      // var magyar = document.createElement('li')
      // magyar.innerHTML = 'Magyar'
      // magyar.onclick = setScreenshotLanguage
      // magyar.language = 'hu'
      // var polski = document.createElement('li')
      // polski.innerHTML = 'Polski'
      // polski.onclick = setScreenshotLanguage
      // polski.language = 'pl'
      // var turkish = document.createElement('li')
      // turkish.innerHTML = 'Türkçe'
      // turkish.onclick = setScreenshotLanguage
      // turkish.language = 'tr'
      // var vietnamese = document.createElement('li')
      // vietnamese.innerHTML = 'Tiếng Việt'
      // vietnamese.onclick = setScreenshotLanguage
      // vietnamese.language = 'vi'
      // var languages = document.createElement('ul')
      // languages.className = 'devices'
      // languages.appendChild(english)
      // languages.appendChild(spanish)
      // languages.appendChild(afrikaans)
      // languages.appendChild(bulgarian)
      // languages.appendChild(magyar)
      // languages.appendChild(turkish)
      // languages.appendChild(vietnamese)
      var settings = document.createElement('div')
      settings.appendChild(devices)
      // settings.appendChild(languages)
      screenshots.parentNode.insertBefore(settings, screenshots.previousSibling)
    }
  }
}

function setScreenshotLanguage (e) {
  var li = e.target
  language = li.language
  var languages = document.getElementsByClassName('devices')[1]
  for (var i = 0, len = languages.children.length; i < len; i++) {
    languages.children[i].className = languages.children[i] === li ? 'current' : ''
  }
  var containers = document.getElementsByClassName('desktop')
  for (i = 0, len = containers.length; i < len; i++) {
    var screenshots = containers[i]
    if (!screenshots) {
      continue
    }
    var images = screenshots.getElementsByTagName('img')
    for (var j = 0, len = images.length; j < len; j++) {
      var image = images[j]
      var filename = image.getAttribute('data-src')
      filename = filename.substring(0, filename.lastIndexOf('-'))
      filename = filename.substring(0, filename.lastIndexOf('-'))
      filename += '-' + device + '-' + language + '.png'
      image.src = filename
      image.style.display = 'block'
      if (window.WAMediaBox.galleries && window.WAMediaBox.galleries._ && window.WAMediaBox.galleries._.mediaList) {
        window.WAMediaBox.galleries._.mediaList[j].src = image.src
      }
    }
  }
  e.preventDefault()
  return false
}

function setScreenshotDevice (e) {
  var li = e.target
  device = li.device
  var devices = document.getElementsByClassName('devices')[0]
  for (var i = 0, len = devices.children.length; i < len; i++) {
    devices.children[i].className = devices.children[i] === li ? 'current' : ''
  }
  var containers = document.getElementsByClassName('desktop')
  for (i = 0, len = containers.length; i < len; i++) {
    var screenshots = containers[i]
    if (!screenshots) {
      continue
    }
    var images = screenshots.getElementsByTagName('img')
    for (var j = 0, len = images.length; j < len; j++) {
      var image = images[j]
      var filename = image.getAttribute('data-src')
      filename = filename.substring(0, filename.lastIndexOf('-'))
      filename = filename.substring(0, filename.lastIndexOf('-'))
      filename += '-' + device + '-' + language + '.png'
      image.src = filename
      image.style.display = 'block'
      if (window.WAMediaBox.galleries && window.WAMediaBox.galleries._ && window.WAMediaBox.galleries._.mediaList) {
        window.WAMediaBox.galleries._.mediaList[j].src = image.src
      }
    }
  }
  e.preventDefault()
  return false
}

function setNoScreenshot (e) {
  var li = e.target
  var devices = document.getElementsByClassName('devices')[0]
  for (var i = 0, len = devices.children.length; i < len; i++) {
    devices.children[i].className = devices.children[i] === li ? 'current' : ''
  }
  var containers = document.getElementsByClassName('desktop')
  for (i = 0, len = containers.length; i < len; i++) {
    var screenshots = containers[i]
    var images = screenshots.getElementsByTagName('img')
    for (var j = 0, len = images.length; j < len; j++) {
      var image = images[j]
      image.style.display = 'none'
    }
  }
  e.preventDefault()
  return false
}
