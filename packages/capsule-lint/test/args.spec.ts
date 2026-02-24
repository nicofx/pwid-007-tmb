import { parseArgs } from '../src/args.js';

describe('parseArgs', () => {
  it('parses capsule and format flags', () => {
    const options = parseArgs(
      ['--capsule', 'berlin-1933', '--format', 'json', '--strict'],
      '/tmp/ws'
    );

    expect(options.capsule).toBe('berlin-1933');
    expect(options.format).toBe('json');
    expect(options.strict).toBe(true);
  });
});
