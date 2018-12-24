import { get } from 'https';
import { format, parse } from 'url';

// tslint:disable:no-var-requires
let registry: string = require('../package.json').publishConfig.registry;

export default function getLatestVersion(packageName: string): Promise<string> {
  let url = parse(registry);
  url.pathname = `/${packageName}`;

  return new Promise((resolve, reject) => {
    get(format(url), response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => (body += chunk));
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`unable to get latest version (code=${response.statusCode}): ${body}`));
        }

        let packageInfo = JSON.parse(body);
        resolve(packageInfo['dist-tags']['latest']);
      });
    }).on('error', reject);
  });
}
