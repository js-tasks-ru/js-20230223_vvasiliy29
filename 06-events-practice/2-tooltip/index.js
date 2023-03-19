class Tooltip {
  static instance

  constructor () {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }
    Tooltip.instance = this;
  }

  onPointerover = ({ target }) => {
    const element = target.closest('[data-tooltip]');

    if (element) {
      const { tooltip } = element.dataset;
      document.addEventListener('pointermove', this.onPointermove);
      this.render(tooltip);
    }
  }

  onPointerout = () => {
    document.removeEventListener('pointermove', this.onPointermove);
    this.remove();
  }

  onPointermove = (event) => {
    this.moveTooltip(event);
  }

  moveTooltip ({ pageX, pageY }) {
    const shift = 10;
    const top = pageY + shift;
    const left = pageX + shift;
    this.element.style.top = top + 'px';
    this.element.style.left = left + 'px';
  }

  initialize () {
    document.addEventListener('pointerover', this.onPointerover);
    document.addEventListener('pointerout', this.onPointerout);
  }

  render (tooltip) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="tooltip">${tooltip}</div>`;
    this.element = wrap.firstElementChild;
    document.body.append(this.element);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.remove();
    this.element = null;
    document.addEventListener('pointerover', this.onPointerover);
    document.addEventListener('pointerout', this.onPointerout);
    document.removeEventListener('pointermove', this.onPointermove);
  }
}

export default Tooltip;
