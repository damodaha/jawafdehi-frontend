import { describe, it, expect } from 'vitest';
import { isCourtCaseRef, courtRefCandidates } from './courtCaseRef';

describe('isCourtCaseRef', () => {
  it('matches bare court case numbers', () => {
    expect(isCourtCaseRef('081-CR-0116')).toBe(true);
    expect(isCourtCaseRef('81-cr-116')).toBe(true);
  });

  it('rejects slugs, numeric ids, and malformed values', () => {
    expect(isCourtCaseRef('case-081-cr-0090-389ad1')).toBe(false);
    expect(isCourtCaseRef('438')).toBe(false);
    expect(isCourtCaseRef('special:081-CR-0116')).toBe(false);
    expect(isCourtCaseRef('93-068-0194')).toBe(false); // numeric middle segment
    expect(isCourtCaseRef(undefined)).toBe(false);
  });
});

describe('courtRefCandidates', () => {
  it('probes special before supreme', () => {
    expect(courtRefCandidates('081-CR-0116')).toEqual([
      'special:081-CR-0116',
      'supreme:081-CR-0116',
    ]);
  });
});
