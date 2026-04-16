// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoaderController } from './loader'

function mockMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: reducedMotion,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

let el: HTMLDivElement

beforeEach(() => {
  el = document.createElement('div')
  el.id = 'loader'
  document.body.appendChild(el)
})

afterEach(() => {
  el.remove()
  vi.restoreAllMocks()
})

describe('LoaderController', () => {
  it('constructor sets data-step to INIT when reduced-motion is off', () => {
    mockMatchMedia(false)
    new LoaderController(el)
    expect(el.dataset.step).toBe('INIT')
  })

  it('advance() updates data-step attribute', () => {
    mockMatchMedia(false)
    const ctrl = new LoaderController(el)
    ctrl.advance('DATA')
    expect(el.dataset.step).toBe('DATA')
  })

  it('advance() progresses through all 4 states', () => {
    mockMatchMedia(false)
    const ctrl = new LoaderController(el)
    expect(el.dataset.step).toBe('INIT')
    ctrl.advance('DATA')
    expect(el.dataset.step).toBe('DATA')
    ctrl.advance('SCENE')
    expect(el.dataset.step).toBe('SCENE')
    ctrl.advance('ONLINE')
    expect(el.dataset.step).toBe('ONLINE')
  })

  it('done() adds the done class', () => {
    mockMatchMedia(false)
    const ctrl = new LoaderController(el)
    ctrl.advance('ONLINE')
    ctrl.done()
    expect(el.classList.contains('done')).toBe(true)
  })

  it('constructor skips to ONLINE when prefers-reduced-motion matches (ATM-04)', () => {
    mockMatchMedia(true)
    new LoaderController(el)
    expect(el.dataset.step).toBe('ONLINE')
  })

  it('done() works after reduced-motion skip', () => {
    mockMatchMedia(true)
    const ctrl = new LoaderController(el)
    ctrl.done()
    expect(el.classList.contains('done')).toBe(true)
  })
})
