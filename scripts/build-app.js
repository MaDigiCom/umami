import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const engine = process.env.NEXT_BUILD_ENGINE === 'webpack' ? '--webpack' : '--turbo';

const result = spawnSync('next', ['build', engine], { stdio: 'inherit', shell: true });

process.exit(result.status ?? 1);
