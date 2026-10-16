import { describe, expect, it } from 'vitest';
import {
  NEW_TAB_URL,
  isHttpUrl,
  readNavigateRequest,
  resolveAddress,
  sanitizeBounds,
} from './navigation';

describe('resolveAddress', () => {
  it('keeps http and https urls', () => {
    expect(resolveAddress('https://www.untoz.com/docs')).toBe('https://www.untoz.com/docs');
    expect(resolveAddress('http://localhost:3000/app')).toBe('http://localhost:3000/app');
  });

  it('adds https to host-like input, including ports', () => {
    expect(resolveAddress('example.com')).toBe('https://example.com');
    expect(resolveAddress('example.com:8080/path')).toBe('https://example.com:8080/path');
    expect(resolveAddress('localhost:5173')).toBe('https://localhost:5173');
  });

  it('turns other text into a search on the selected engine', () => {
    expect(resolveAddress('unt oz browser')).toBe(
      'https://www.google.com/search?q=unt%20oz%20browser'
    );
    expect(resolveAddress('privacidade', 'duckduckgo')).toBe(
      'https://duckduckgo.com/?q=privacidade'
    );
  });

  it('rejects dangerous and non-web schemes', () => {
    expect(resolveAddress('javascript:alert(1)')).toBeNull();
    expect(resolveAddress('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(resolveAddress('file:///etc/passwd')).toBeNull();
    expect(resolveAddress('blob:https://example.com/id')).toBeNull();
    expect(resolveAddress('   ')).toBeNull();
  });

  it('keeps the internal new tab url', () => {
    expect(resolveAddress(NEW_TAB_URL)).toBe(NEW_TAB_URL);
    expect(isHttpUrl(NEW_TAB_URL)).toBe(false);
  });
});

describe('sanitizeBounds', () => {
  it('rounds finite bounds and clamps negatives to zero', () => {
    expect(sanitizeBounds({ x: -4.2, y: 10.2, width: 80.6, height: 40.2 })).toEqual({
      x: 0,
      y: 10,
      width: 81,
      height: 40,
    });
  });

  it('rejects malformed bounds', () => {
    expect(sanitizeBounds(null)).toBeNull();
    expect(sanitizeBounds({ x: 0, y: 0, width: Number.NaN, height: 10 })).toBeNull();
    expect(sanitizeBounds({ x: '0', y: 0, width: 10, height: 10 })).toBeNull();
  });
});

describe('readNavigateRequest', () => {
  it('accepts an http payload for a known tab and a legacy string', () => {
    expect(readNavigateRequest({ tabId: 't1', url: 'https://example.com' }, 'other')).toEqual({
      tabId: 't1',
      url: 'https://example.com',
    });
    expect(readNavigateRequest('https://example.com', 't1')).toEqual({
      tabId: 't1',
      url: 'https://example.com',
    });
  });

  it('rejects unsafe targets', () => {
    expect(readNavigateRequest({ tabId: '../x', url: 'https://example.com' }, 't1')).toBeNull();
    expect(readNavigateRequest({ tabId: 't1', url: 'file:///tmp/secret' }, 't1')).toBeNull();
    expect(readNavigateRequest('javascript:alert(1)', 't1')).toBeNull();
  });
});
