import { spawnSync } from 'node:child_process';

const commands = [
  ['packaging config', ['run', 'check:packaging-config']],
  ['control center', ['run', 'check:control-center']],
  ['native rollout', ['run', 'check:native-rollout']],
  ['runtime bundle', ['run', 'check:package']],
  ['unit tests', ['test']],
  ['typecheck', ['run', 'typecheck']],
];

for (const [name, args] of commands) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`FAIL release check: ${name}`);
    process.exit(result.status ?? 1);
  }
}
console.log('\nPASS release checks');
