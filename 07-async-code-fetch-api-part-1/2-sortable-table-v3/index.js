import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element
  subElements = {}
  offset = 30

  constructor (headerConfig = [], {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    },
    isSortLocally = false,
    url = ''
  } = {}) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.sorted = sorted;
    this.sorted.start = 0;
    this.sorted.end = this.sorted.start + this.offset;
    this.url = new URL(url, BACKEND_URL);
    this.isSortLocally = isSortLocally;
    this.loading = false;
    this.render();
  }

  onWindowScroll = async () => {
    const { bottom } = this.element.getBoundingClientRect();
    const { id, order } = this.sorted;

    if (bottom < document.documentElement.clientHeight && !this.loading && !this.isSortLocally) {
      this.sorted.start = this.sorted.end;
      this.sorted.end = this.sorted.start + this.offset;
      this.loading = true;

      const data = await this.loadData(this.sorted);

      this.update(data);

      this.loading = false;
    }
  }
  onSortClick = event => {
    const column = event.target.closest('[data-sortable="true"]');

    const toggleOrder = order => {
      const orders = {
        asc: 'desc',
        desc: 'asc',
      };

      return orders[order];
    };

    if (column) {
      const { id, order } = column.dataset;
      const newOrder = toggleOrder(order); // undefined
      const arrow = column.querySelector('.sortable-table__sort-arrow');

      column.dataset.order = newOrder;

      if (!arrow) {
        column.append(this.subElements.arrow);
      }

      if (this.isSortLocally) {
        this.sortOnClient(id, newOrder);
      } else {
        this.sortOnServer(id, newOrder);
      }

    }
  }

  update (data) {
    const wrap = document.createElement('div');
    this.data = [...this.data, ...data];
    wrap.innerHTML = this.getTableRows(data);
    this.subElements.body.append(...wrap.childNodes);
  }

  getTableHeader () {
    return `<div data-element="header" class="sortable-table__header sortable-table__row">
      ${this.headerConfig.map(item => this.getHeaderRow(item)).join('')}
    </div>`;
  }

  addRows (data) {
    this.subElements.loading.style.display = 'none';
    if (data.length) {
      this.data = data;
      this.subElements.body.innerHTML = this.getTableRows(data);
    }

  }

  getHeaderRow ({ id, title, sortable }) {
    const order = this.sorted.id === id ? this.sorted.order : 'asc';

    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
        <span>${title}</span>
        ${this.getHeaderSortingArrow(id)}
      </div>
    `;
  }

  getHeaderSortingArrow (id) {
    const isOrderExist = this.sorted.id === id ? this.sorted.order : '';

    return isOrderExist
      ? `<span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`
      : '';
  }

  getTableBody (data) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getTableRows(data)}
      </div>`;
  }

  getTableRows (data) {
    return data.map(item => `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getTableRow(item)}
      </a>`
    ).join('');
  }

  getTableRow (item) {
    const cells = this.headerConfig.map(({ id, template }) => {
      return {
        id,
        template
      };
    });

    return cells.map(({ id, template }) => {
      return template
        ? template(item[id])
        : `<div class="sortable-table__cell">${item[id]}</div>`;
    }).join('');
  }

  getLoading () {
    return `<div data-element="loading" class="loading-line sortable-table__loading-line"></div>`;
  }

  getTable (data) {
    return `
      <div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getLoading()}
        ${this.getTableBody(data)}
     </div>`;
  }

  async render () {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = this.getTable(this.data);

    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.subElements.loading.style.display = 'block';
    const loadedData = await this.loadData(this.sorted);
    this.addRows(loadedData);

    this.initEventListeners();
  }

  initEventListeners () {
    this.subElements.header.addEventListener('pointerdown', this.onSortClick);
    window.addEventListener('scroll', this.onWindowScroll);
  }

  getSubElements (element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }

    return result;
  }

  sortOnClient (id, order) {
    const sortedData = this.sortData(id, order);
    this.addRows(sortedData);
  }

  async sortOnServer (id, order) {
    this.sorted = {
      id,
      order,
      start: 0,
      end: this.offset
    };
    const sortedData = await this.loadData(this.sorted);
    this.addRows(sortedData);

  }

  sortData (id, order) {
    const arr = [...this.data];
    const column = this.headerConfig.find(item => item.id === id);
    const { sortType, customSorting } = column;
    const direction = order === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      switch (sortType) {
      case 'number':
        return direction * (a[id] - b[id]);
      case 'string':
        return direction * a[id].localeCompare(b[id], 'ru');
      case 'custom':
        return direction * customSorting(a, b);
      default:
        throw new Error(`Неизвестный тип сортировки ${sortType}`);
      }
    });
  }

  async loadData ({ id, order, start = 0, end = this.offset } = {}) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);
    return await fetchJson(this.url);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.remove();
    this.element = null;
    this.subElements = null;
  }
}
