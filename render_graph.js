var args = require('system').args;

function usage() {
    var help = "Usage: phantomjs " + args[0] + " <url> <output path> [viewport width] [viewport height] [zoom factor]";
    return help;
}

if (args.length < 3) {
   console.log(usage()); 
   phantom.exit();
}

var url = args[1],
    out = args[2],
    width = args[3] || 960,
    height = args[4] || 500,
    zoom = args[5] || 2;

var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: width, height: height };
page.zoomFactor = zoom;
page.open(args[1], function start(status) {
      page.render(out, {format: 'gif', quality: '100'});
        phantom.exit();
});
