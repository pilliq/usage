var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: 960, height: 500 };
page.zoomFactor = 2;
page.open("http://localhost:8080/viz", function start(status) {
      page.render('viz.gif', {format: 'gif', quality: '100'});
        phantom.exit();
});
