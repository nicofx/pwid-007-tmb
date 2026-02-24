import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  validateGameplayInvariants,
  validateReferentialIntegrity,
  validateSchema
} from '../src/validators.js';

function loadFixture(relativePath: string): unknown {
  const filepath = path.resolve(process.cwd(), '../../fixtures/capsules', relativePath);
  return JSON.parse(readFileSync(filepath, 'utf8')) as unknown;
}

describe('capsule-lint validators', () => {
  it('passes minimal fixture schema', () => {
    const raw = loadFixture('minimal_ok/minimal-ok.json');
    const schema = validateSchema(raw);

    expect(schema.capsule).toBeDefined();
    expect(schema.issues).toHaveLength(0);
  });

  it('detects missing refs', () => {
    const raw = loadFixture('invalid_refs/invalid-refs.json');
    const schema = validateSchema(raw);
    expect(schema.capsule).toBeDefined();

    const issues = validateReferentialIntegrity(schema.capsule!);
    expect(issues.some((entry) => entry.code === 'MISSING_REF')).toBe(true);
    expect(issues.some((entry) => entry.severity === 'ERROR')).toBe(true);
  });

  it('detects dead-end gameplay issue', () => {
    const raw = loadFixture('dead_end/dead-end.json');
    const schema = validateSchema(raw);
    expect(schema.capsule).toBeDefined();

    const issues = validateGameplayInvariants(schema.capsule!);
    expect(issues.some((entry) => entry.code === 'NO_OPTIONS_DEAD_END')).toBe(true);
  });

  it('detects duplicate ids', () => {
    const raw = loadFixture('duplicate_ids/duplicate-ids.json');
    const schema = validateSchema(raw);
    expect(schema.capsule).toBeDefined();

    const issues = validateReferentialIntegrity(schema.capsule!);
    expect(issues.some((entry) => entry.code === 'DUPLICATE_ID')).toBe(true);
  });
});
