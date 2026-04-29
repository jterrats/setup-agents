import { spawn } from 'node:child_process';
import type { RunLocalRequest } from '../types';

export type CommandStreamHandlers = {
  onStdout: (text: string) => void;
  onStderr: (text: string) => void;
  onClose: (code: number | null, command: string) => void;
};

export class CliService {
  public runSetupAgentsUpdate(cwd: string, handlers: CommandStreamHandlers): void {
    this.run(cwd, ['setup-agents', 'update'], handlers);
  }

  public runSetupAgentsLocal(cwd: string, request: RunLocalRequest, handlers: CommandStreamHandlers): void {
    const args = ['setup-agents', 'local'];

    if (request.rules) args.push('--rules', request.rules);
    if (request.profiles.length > 0) args.push('--profile', request.profiles.join(','));
    if (request.force) args.push('--force');
    if (request.scope === 'user') args.push('--scope', 'user');

    this.run(cwd, args, handlers);
  }

  private run(cwd: string, args: string[], handlers: CommandStreamHandlers): void {
    const command = ['sf', ...args].join(' ');
    const child = spawn('sf', args, { cwd, env: process.env });

    child.stdout.on('data', (chunk: Buffer) => handlers.onStdout(chunk.toString('utf8')));
    child.stderr.on('data', (chunk: Buffer) => handlers.onStderr(chunk.toString('utf8')));
    child.on('close', (code) => handlers.onClose(code, command));
    child.on('error', (error) => handlers.onStderr(`Failed to run command: ${error.message}\n`));
  }
}
