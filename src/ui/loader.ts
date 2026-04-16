export type LoaderStep = 'INIT' | 'DATA' | 'SCENE' | 'ONLINE'

export class LoaderController {
  private el: HTMLElement

  constructor(el: HTMLElement) {
    this.el = el
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      this.advance('ONLINE')
    } else {
      this.advance('INIT')
    }
  }

  advance(step: LoaderStep): void {
    this.el.dataset.step = step
  }

  done(): void {
    this.el.classList.add('done')
  }
}
