var page = require('webpage').create();
var system = require('system');

var encoding = system.args[1];
var url = system.args[2];
var clip = system.args[3];
var width = system.args[4];
var height = system.args[5];

system.stdout.setEncoding(encoding);

page.viewportSize = {
  width: width,
  height: height
};

clip = clip === 'true';

if (clip) {
  page.clipRect = {
    top: 0,
    left: 0,
    width: width,
    height: height
  };
}

page.open(url, function (status) {
  if (status !== 'success') {
    console.log('Unable to load the address!');
    phantom.exit();
  } else {
    window.setTimeout(function () {
      page.render('/dev/stdout', {
        format: 'png'
      });
      phantom.exit();
    }, 1000);
  }
});