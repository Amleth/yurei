import 'babel-polyfill';
import configYaml from 'config-yaml';
import http from 'http';
import Nightmare from 'nightmare';
import node_url from 'url';
import v from 'validator';

const config = configYaml(`${__dirname}/../config.yml`);

http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    res.end(JSON.stringify({
      errorMessages: 'Bad method'
    }));
  }
  else {
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
      else {
        height = parseInt(height);
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
      else {
        width = parseInt(width);
      }

      return [ok, errorMessages];
    };

    const [parametersOk, badParametersErrorMessages] = checkParams();

    if (!parametersOk) {
      res.writeHead(400, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        errorMessages: badParametersErrorMessages
      }));
      return;
    }

    const nightmare = new Nightmare();

    nightmare.goto(url)
    .viewport(width, height)
    .wait(100)
    .screenshot()
    .end()
    .then(function (data) {
      res.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'image/png'});
      res.end(data, 'binary');
    })
    .catch((err) => {
      console.log(`ERROR: ${err} - ${url}`);
    });
  }
}).listen(config['port']);