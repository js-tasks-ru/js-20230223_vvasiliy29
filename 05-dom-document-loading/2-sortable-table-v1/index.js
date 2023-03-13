export default class SortableTable {
  subElements = null;
  direction = { asc: 1, desc: -1 };

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.render();
  }

  get template() {
    return `<div data-element="productsContainer" class="products-list__container">
                <div class="sortable-table">
                    <div data-element="header" class="sortable-table__header sortable-table__row">${this.getHeaderRow()}</div>
                    <div data-element="body" class="sortable-table__body">${this.getBody()}</div>
                </div>
            </div>`;
  }

  render() {
    const wrap = document.createElement("div");
    wrap.innerHTML = this.template;
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements();
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

  getHeaderRow() {
    return this.headerConfig
      .map(
        (cell) => `<div class="sortable-table__cell"
                data-id="${cell.id}"
                data-sortable="${cell.sortable}"
                data-order="">
                <span>${cell.title}</span>
                ${cell.sortable ? this.getSortArrow() : ""}
            </div>`
      )
      .join("");
  }

  getSortArrow() {
    return `<span data-element="arrow" class="sortable-table__sort-arrow"><span class="sort-arrow"></span></span>`;
  }

  getBody(data = this.data) {
    return data.map((product) => this.getBodyRow(product)).join("");
  }

  getBodyRow(product) {
    return `<a href="/products/${product.id}" class="sortable-table__row">
              ${this.headerConfig
                .map((cell) => {
                  const data = product[cell.id] || [];
                  return cell.template
                    ? cell.template(data)
                    : `<div class="sortable-table__cell">${data}</div>`;
                })
                .join("")}
           </a>`;
  }

  sortData(value, order) {
    const directions = { asc: 1, desc: -1 };
    const sortType = this.headerConfig.find((i) => i.id === value)?.sortType;

    const sortCallback = (a, b) => {
      if (sortType === "number") {
        return directions[order] * (a[value] - b[value]);
      }
      return (
        directions[order] *
        a[value].localeCompare(b[value], ["ru", "en"], { caseFirst: "upper" })
      );
    };

    return [...this.data].sort(sortCallback);
  }

  sort(value = "title", order = "asc") {
    const sortedData = this.sortData(value, order);
    const headerCells = this.subElements.header.querySelectorAll("[data-id]");
    let activeHeadCell = null;
    for (const headCell of headerCells) {
      headCell.dataset.order = "";
      if (headCell.dataset.id === value) {
        activeHeadCell = headCell;
      }
    }
    if (activeHeadCell) {
      activeHeadCell.dataset.order = order;
    }
    this.update(sortedData);
  }

  update(data) {
    this.subElements.body.innerHTML = this.getBody(data);
  }

  reset() {
    this.update(this.data);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.data = [];
    this.subElements = null;
  }
}
