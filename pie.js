var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: 1600, height: 1200 };
page.zoomFactor = 2;
page.open("http://localhost:8000/pie_viz", function start(status) {
      page.render('pie_viz.tmp.gif', {format: 'gif', quality: '100'});
        phantom.exit();
});
