import { get } from 'https';
import { format, parse } from 'url';
import pkg from '../package.json';

const registry = pkg.publishConfig.registry;

export default function getLatestVersion(packageName: string): Promise<string> {
  const url = parse(registry);
  url.pathname = `/${packageName}`;

  return new Promise((resolve, reject) => {
    get(format(url), (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`unable to get latest version (code=${response.statusCode as number}): ${body}`));
        }

        const packageInfo = JSON.parse(body) as { 'dist-tags': { latest: string } };
        resolve(packageInfo['dist-tags']['latest']);
      });
    }).on('error', reject);
  });
}
