# Documentation

This is the documentation generator for the [userdashboard.github.io repo](https://github.com/userdashboard/userdashboard.github.io).  When Dashboard or its modules update their Github Actions run test suites, configured to save browser screenshots and API responses, and those files get submitted to the documentation site repository.  The documentation site uses this software to regenerate the HTML pages when new assets are committed.

You can browse the generated documentation at [https://userdashboard.github.io](https://userdashboard.github.io) or at its [repository](https://github.com/userdashboard/userdashboard.github.io).

# Usage

This software assumes the UI screenshots and API responses have been generated separately.  It still requires a copy of Dashboard and its modules to translate the readme.md files, map the UI structure from the file system, and map the API parameters from their tests.  It supports scanning multiple dashboard servers for providing example projects.   The example projects are only partially-documented, their UI and API indexes are not generated but individual pages are so the visual sitemap can link to them. 

First the documentation site repository must be cloned:

    $ git clone https://github.com/userdashboard/userdashboard.github.io documentation-site

Then the dashboard server is set up with the modules being documented:

    $ mkdir dashboard-server
    $ cd dashboard-server
    $ npm init -y
    $ npm install @userdashboard/dashboard @userdashboard/maxmind-geoip @userdashboard/organizations @userdashboard/stripe-connect @userdashboard/stripe-subscriptions
    $ cd ..

Then any example projects can be added, if applicable:

    $ git clone https://github.com/userdashboard/example-web-app
    $ cd example-web-app/dashboard-server
    $ npm install
    $ cd ../..

    $ git clone https://github.com/userdashboard/example-subscription-web-app
    $ cd example-subscription-web-app/dashboard-server
    $ npm install
    $ cd ../..

Then the documentation generator is run and it writes new HTML to the documentation site's folder.  You can pass as many examples as required.

    $ git clone https://github.com/userdashboard/documentation
    $ cd documentation
    $ DOCUMENTATION_PATH=/path/to/documentation-site \
      DASHBOARD_SERVER_PATH=/path/to/dashboard-server \
      EXAMPLE_DASHBOARD_SERVER_PATH1=/path/to/example-web-app/dashboard-server \
      EXAMPLE_DASHBOARD_SERVER_PATH2=/path/to/example-suscription-web-app/dashboard-server \
      node main.js

# Support and contributions

If you have encountered a problem post an issue on the appropriate [Github repository](https://github.com/userdashboard).  

If you would like to contribute check [Github Issues](https://github.com/userdashboard/dashboard) for ways you can help. 

For help using or contributing to this software join the freenode IRC `#userdashboard` chatroom - [Web IRC client](https://kiwiirc.com/nextclient/).

## License

This software is licensed under the MIT license, a copy is enclosed in the `LICENSE` file.  Included icon assets and the CSS library `pure-min` is licensed separately, refer to the `icons/licenses` folder and `src/www/public/pure-min.css` file for their licensing information.

Copyright (c) 2017 - 2020 Ben Lowry

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.