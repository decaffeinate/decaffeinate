import { execFile } from 'mz/child_process';
import { readFile } from 'mz/fs';
import { join } from 'path';
import getLatestVersion from './getLatestVersion';
import assert from 'assert';

let commit = true;

for (let i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--no-commit':
      commit = false;
      break;

    default:
      console.error('error: unexpected argument:', process.argv[i]);
      console.error('update-website [--no-commit|--force]');
      process.exit(-1);
  }
}

interface Package {
  name: string;
  version: string;
  dependencies: { [name: string]: string };
  devDependencies: { [name: string]: string };
  publishConfig: { [name: string]: string };
}

async function pkg(): Promise<Package> {
  const content = await readFile(join(__dirname, '../package.json'), { encoding: 'utf8' });
  return JSON.parse(content) as Package;
}

async function configureGithubRemote(name: string, project: string): Promise<void> {
  const url = `git@github.com:${project}.git`;

  try {
    await run('git', ['remote', 'remove', 'website']);
  } catch (err) {
    // that's fine
  }

  console.log(`Adding remote ${name}…`);
  await run('git', ['remote', 'add', '-f', name, url]);
  await run('git', ['config', 'user.name', 'Brian Donovan']);
  await run('git', ['config', 'user.email', '1938+eventualbuddha@users.noreply.github.com']);
}

async function run(command: string, args: Array<string>): Promise<{ stdout: string; stderr: string }> {
  const [stdout, stderr] = await execFile(command, args);
  return { stdout, stderr };
}

async function gitRevParse(ref: string): Promise<string> {
  const { stdout } = await run('git', ['rev-parse', ref]);
  return stdout.trim();
}

async function hasChanges(): Promise<boolean> {
  // update the cache
  await run('git', ['status']);

  try {
    await run('git', ['diff-index', '--exit-code', 'HEAD', '--']);
    return false;
  } catch (err) {
    return true;
  }
}

async function updateWebsite(): Promise<void> {
  await configureGithubRemote('website', 'decaffeinate/decaffeinate-project.org');

  const name = (await pkg()).name;
  const latestVersion = await getLatestVersion(name);
  const currentRef = await gitRevParse('HEAD');
  const decaffeinatePackage = await pkg();
  const decaffeinateRegistry = decaffeinatePackage['publishConfig']['registry'];

  console.log('Setting up website repo…');
  await run('git', ['fetch', '-f', 'website', 'main:website-main']);
  await run('git', ['reset', '--hard', 'website-main']);

  const websitePackage = await pkg();
  const currentVersion = websitePackage['devDependencies']['decaffeinate'];

  if (currentVersion === latestVersion) {
    console.log(`Already using decaffeinate v${latestVersion}, skipping install.`);
  } else {
    console.log(`${currentVersion} != ${latestVersion}, installing decaffeinate v${latestVersion}…`);
    const args = ['install', '--save-dev', '--save-exact', `decaffeinate@${latestVersion}`];

    if (decaffeinateRegistry) {
      args.unshift('--registry', decaffeinateRegistry);
    }

    await run('pnpm', args);

    if (await hasChanges()) {
      if (commit) {
        console.log('Pushing changes to website repo…');
        await run('git', ['commit', '-av', '-m', `chore: update to decaffeinate ${latestVersion}`]);
        await run('git', ['push', 'website', 'HEAD:main']);
      } else {
        console.log('Not committing because --no-commit was given:');
        console.log((await run('git', ['diff'])).stdout);
      }
    }
  }

  console.log(`Switching back to ${currentRef.slice(0, 7)}…`);
  await run('git', ['reset', '--hard', currentRef]);
}

updateWebsite().catch((err) => {
  assert(err instanceof Error);
  console.error(err.stack);
  process.exit(1);
});
