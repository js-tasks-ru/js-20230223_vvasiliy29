export default class SortableList {
  draggingItem
  placeHolder

  constructor ({ items = [] } = {}) {
    this.items = items;
    this.render();
  }

  onDraggingItem = ({ pageX, pageY }) => {
    const { shiftTop, shiftLeft } = this.draggingItem.dataset;
    const top = pageY - shiftTop;
    const left = pageX - shiftLeft;

    const { top: placeholderTop } = this.placeHolder.getBoundingClientRect();
    const isMoveDown = placeholderTop < top;
    const isMoveTop = placeholderTop > top;

    const topSibling = (item) => item.getBoundingClientRect().top;

    if (isMoveDown) {
      const nextSibling = this.placeHolder.nextSibling;
      const isUnderSibling = nextSibling ? top > topSibling(nextSibling) : false;
      if (isUnderSibling) {
        nextSibling.after(this.placeHolder);
      }

    }
    if (isMoveTop) {
      const prevSibling = this.placeHolder.previousSibling;
      const isOverSibling = prevSibling ? top < topSibling(prevSibling) : false;
      if (isOverSibling) {
        prevSibling.before(this.placeHolder);
      }

    }

    this.draggingItem.style.top = top + 'px';
    this.draggingItem.style.left = left + 'px';
  }

  onPointerDown (event) {
    event.preventDefault();
    const { target } = event;
    const item = target.closest('li');
    if (!item) {return;}
    console.log('safas');
    if (target.dataset.deleteHandle !== undefined) {
      item.remove();
    } else {
      this.dragItem(event);
    }
  }

  dragItem ({ target, clientX, clientY }) {
    const item = target.closest('li');

    const { width, height, left, top } = item.getBoundingClientRect();
    this.draggingItem = item;
    this.placeHolder = this.createPlaceHolder(width, height);
    this.draggingItem.before(this.placeHolder);
    this.draggingItem.classList.add('sortable-list__item_dragging');

    this.draggingItem.dataset.shiftTop = clientY - top;
    this.draggingItem.dataset.shiftLeft = clientX - left;

    const style = {
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px'
    };
    for (const [prop, value] of Object.entries(style)) {
      this.draggingItem.style[prop] = value;
    }

    this.element.addEventListener('pointermove', this.onDraggingItem);

  }

  onDropItem (e) {
    if (this.draggingItem) {
      this.element.removeEventListener('pointermove', this.onDraggingItem);
      this.draggingItem.classList.remove('sortable-list__item_dragging');
      ['left', 'top', 'width', 'height'].map(prop => this.draggingItem.style[prop] = '');
      this.placeHolder.after(this.draggingItem);
      this.removePlaceHolder();
      this.draggingItem.dataset.shiftTop = 0;
      this.draggingItem.dataset.shiftLeft = 0;
      this.draggingItem = null;
    }
  }

  render () {
    this.element = document.createElement('ul');
    this.element.classList.add('sortable-list');
    this.element.append(...this.items);
    this.items.map(item => {item.classList.add('sortable-list__item');});
    this.initListeners();
  }

  createPlaceHolder (width, height) {
    if (this.placeHolder) {return this.placeHolder;}
    const placeHolder = document.createElement('div');
    placeHolder.classList.add('sortable-list__placeholder');
    placeHolder.style.width = width + 'px';
    placeHolder.style.height = height + 'px';
    return placeHolder;
  }

  removePlaceHolder () {
    if (this.placeHolder) {
      this.placeHolder.remove();
    }
  }

  initListeners () {
    this.element.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.element.addEventListener('pointerup', (e) => this.onDropItem(e));
    this.items.map(item => {item.addEventListener('dragstart', () => false);});
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.remove();
    this.element = null;
  }

}
