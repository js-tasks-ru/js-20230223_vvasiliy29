export default class SortableTable {
  isSortLocally = true;
  element;

  constructor(headersConfig, { data = [], sorted = {} } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.initialSort = sorted;
    this.render();
    this.initListeners();
  }

  static get ASC() {
    return "asc";
  }

  static get DESC() {
    return "desc";
  }

  get sortableHeads() {
    return (
      this.subElements.header.querySelectorAll("[data-sortable=true]") || []
    );
  }

  set activeSortHead({ id: field, order }) {
    this.sortableHeads.forEach((head) => {
      head.dataset.order = "";
    });

    this.element.querySelector(
      `.sortable-table__cell[data-id="${field}"]`
    ).dataset.order = order;
  }

  static getDirection(order) {
    const directions = { [SortableTable.ASC]: 1, [SortableTable.DESC]: -1 };
    return directions[order];
  }

  onHeadPointerDown = ({ target }) => {
    const head = target.dataset?.id ? target : target.closest("[data-id]");

    const isEmptyOrder = !head.dataset.order;
    const isAsc = head.dataset.order === SortableTable.ASC;

    const sorted = {
      id: head.dataset.id || "",
      order: isEmptyOrder || isAsc ? SortableTable.DESC : SortableTable.ASC,
    };

    this.sort(sorted);
  };

  render() {
    const wrap = document.createElement("div");
    wrap.innerHTML = this.getTable();
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements();
  }

  initListeners() {
    this.sortableHeads.forEach(
      (head) => head.addEventListener("pointerdown", this.onHeadPointerDown),
      true
    );
  }

  removeListeners() {
    this.sortableHeads.forEach((head) =>
      head.removeEventListener("pointerdown", this.onHeadPointerDown)
    );
  }

  getTable() {
    const data = this.initialSort?.id
      ? this.sortData(this.initialSort)
      : this.data;
    return `
      <div class="sortable-table">
         <div data-element="header" class="sortable-table__header sortable-table__row">
            ${this.getHeaderRow()}
         </div>
         <div data-element="body" class="sortable-table__body">
            ${this.getBody(data)}
         </div>
      </div>`;
  }

  getHeaderRow() {
    return this.headersConfig.map((item) => this.getHeaderCell(item)).join("");
  }

  getHeaderCell({ id, title, sortable }) {
    const order = this.initialSort?.id === id ? this.initialSort?.order : "";
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
         <span>${title}</span>
         ${sortable ? this.getHeaderSortArrow() : ""}
      </div>`;
  }

  getHeaderSortArrow() {
    return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
            <span class="sort-arrow"></span>
        </span>`;
  }

  getBody(data = []) {
    return data.map((item) => this.getBodyRow(item)).join("");
  }

  getBodyRow(product) {
    const cellCallback = ({ id: field, template }) =>
      this.getBodyCell(product[field], template);

    return `
      <a href="/products/${product.id}" class="sortable-table__row">
         ${this.headersConfig.map(cellCallback).join("")}
      </a>`;
  }

  getBodyCell(productField, template) {
    return template
      ? template(productField)
      : `<div class="sortable-table__cell">${productField}</div>`;
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-element]");
    for (let subElement of elements) {
      let name = subElement.dataset.element;
      result[name] = subElement;
    }
    return result;
  }

  sortData({ id: field, order = SortableTable.ASC }) {
    const { sortType } = this.headersConfig.find((i) => i.id === field);
    const direction = SortableTable.getDirection(order);

    return [...this.data].sort((a, b) => {
      switch (sortType) {
        case "number":
          return direction * (a[field] - b[field]);
        case "string":
          return direction * a[field].localeCompare(b[field], ["ru", "en"]);
        default:
          throw new Error(`Unknown type ${sortType}`);
      }
    });
  }

  sort(sorted = {}) {
    if (this.isSortLocally) {
      this.sortOnClient(sorted);
    } else {
      this.sortOnServer(sorted);
    }
  }

  sortOnClient(sorted) {
    const sortedData = this.sortData(sorted);
    this.activeSortHead = sorted;
    this.update(sortedData);
  }

  sortOnServer(sorted) {
    this.activeSortHead = sorted;
    this.update([]);
  }

  update(data) {
    this.subElements.body.innerHTML = this.getBody(data);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
