var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: 1920, height: 1200 };
page.zoomFactor = 2;
page.open("http://localhost:8080/pie_viz", function start(status) {
      page.render('pie_viz.gif', {format: 'gif', quality: '100'});
        phantom.exit();
});
