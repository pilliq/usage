var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: 1600, height: 1200 };
page.zoomFactor = 3;
page.open("http://localhost:8000/stack", function start(status) {
      page.render('static/img/stack.gif', {format: 'gif', quality: '100'});
        phantom.exit();
});
