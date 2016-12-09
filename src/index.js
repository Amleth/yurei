import 'babel-polyfill';
import configYaml from 'config-yaml';
import http from 'http';
import path from 'path';
import phantomjs from 'phantomjs-prebuilt';
import child_process from 'child_process';
import node_url from 'url';
import v from 'validator';

const config = configYaml(`${__dirname}/../config.yml`);

http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
  }
  else {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    const params = node_url.parse(req.url, true).query;
    let {clip, height, url, urn, width} = params;

    const checkParams = () => {
      let ok = true;
      let errorMessages = [];

      if (clip == undefined || !v.isBoolean(clip)) {
        ok = false;
        errorMessages.push(`'clip' parameter must be either 'true' or 'false'`);
      }
      else {
        clip = clip === 'true';
      }

      if (height == undefined || !v.isInt(height, {min: 1, max: 1920})) {
        ok = false;
        errorMessages.push(`'height' parameter must be an int between 1 and 1920`);
      }

      if (url == undefined || !v.isURL(url)) {
        ok = false;
        errorMessages.push(`'url' parameter must be a valid URL`);
      }

      if (urn == undefined || !v.isUUID(urn)) {
        ok = false;
        errorMessages.push(`'urn' parameter must be a valid UUID`);
      }

      if (width == undefined || !v.isInt(width, {min: 1, max: 1920})) {
        ok = false;
        errorMessages.push(`'width' parameter must be an int between 1 and 1920`);
      }

      return [ok, errorMessages];
    };

    const [parametersOk, badParametersErrorMessages] = checkParams();

    if (!parametersOk) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        errorMessages: badParametersErrorMessages
      }));
      return;
    }

    const childArgs = [
      path.join(__dirname, 'phantomjs-script.js'),
      config['encoding'],
      url,
      clip,
      width,
      height
    ];

    const child = child_process.spawn(phantomjs.path, childArgs);

    child.stdout.on('data', (data) => {
      res.writeHead(200, {'Content-Type': 'image/png'});
      res.end(data, 'binary');
    });

    child.stderr.on('data', (data) => {
      console.log('stderr: ' + data);
    });

    child.on('close', (code) => {
      console.log('child process exited with code ' + code);
    });
  }
}).listen(config['port']);