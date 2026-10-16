import { describe, expect, it } from 'vitest';
import { addTab, createTabId, removeTab, updateTab, type TabsState } from './tabs';

const empty: TabsState = { tabs: [], activeTabId: null };

describe('tabs', () => {
  it('creates ids that are safe to send over IPC', () => {
    expect(createTabId(() => 0)).toMatch(/^t[a-z0-9]+$/);
    expect(createTabId(() => 0.123456)).toMatch(/^t[a-z0-9]+$/);
  });

  it('activates the tab to the right when the active tab closes', () => {
    let state = empty;
    state = addTab(state, { id: 'a', url: 'https://a.example', title: 'A' });
    state = addTab(state, { id: 'b', url: 'https://b.example', title: 'B' });
    state = addTab(state, { id: 'c', url: 'https://c.example', title: 'C' });
    state = { ...state, activeTabId: 'a' };
    state = removeTab(state, 'a');
    expect(state.tabs.map((tab) => tab.id)).toEqual(['b', 'c']);
    expect(state.activeTabId).toBe('b');
  });

  it('activates the tab to the left when the last tab closes', () => {
    let state = empty;
    state = addTab(state, { id: 'a', url: 'https://a.example', title: 'A' });
    state = addTab(state, { id: 'b', url: 'https://b.example', title: 'B' });
    state = removeTab(state, 'b');
    expect(state.activeTabId).toBe('a');
  });

  it('keeps the active tab when a background tab closes and clears the last tab', () => {
    let state = addTab(empty, { id: 'a', url: 'https://a.example', title: 'A' });
    state = addTab(state, { id: 'b', url: 'https://b.example', title: 'B' });
    state = { ...state, activeTabId: 'a' };
    state = removeTab(state, 'b');
    expect(state.activeTabId).toBe('a');
    state = removeTab(state, 'a');
    expect(state).toEqual({ tabs: [], activeTabId: null });
  });

  it('updates a tab without letting the id change', () => {
    const state = addTab(empty, { id: 'a', url: 'https://a.example', title: 'A' });
    const next = updateTab(state, 'a', { id: 'hijack', title: 'Depois', url: 'https://b.example' });
    expect(next.tabs[0]).toMatchObject({ id: 'a', title: 'Depois', url: 'https://b.example' });
  });
});
