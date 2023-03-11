export default class ColumnChart {
  chartHeight = 50;
  subElements = {};

  constructor({
    data = [],
    label = "",
    value = 0,
    link = "",
    formatHeading = (data) => data,
  } = {}) {
    this.data = data;
    this.label = label;
    this.link = link;
    this.value = value;
    this.formatHeading = formatHeading;
    this.render();
  }

  get template() {
    return `<div class="column-chart column-chart_loading" style="--chart-height: ${
      this.chartHeight
    }">
      <div class="column-chart__title">Total ${
        this.label
      } ${this.getLink()}</div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">
            ${this.getHeader()}
        </div>
        <div data-element="body" class="column-chart__chart">
          ${this.getBody()}
        </div>
      </div>
    </div>`;
  }

  getHeader() {
    return this.formatHeading(this.value);
  }

  getLink() {
    return this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : "";
  }

  getBody() {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data
      .map((item) => {
        const percent = ((item / maxValue) * 100).toFixed(0) + "%";
        const value = String(Math.floor(item * scale));
        return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
      })
      .join("");
  }

  render() {
    const wrap = document.createElement("div");
    wrap.innerHTML = this.template;

    this.element = wrap.firstElementChild;

    if (this.data.length) {
      this.element.classList.remove("column-chart_loading");
    }
    this.subElements = this.getSubElements();
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-element]");
    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }
    return result;
  }
  update(data) {
    if (data.length) {
      this.element.classList.remove("column-chart_loading");
    } else {
      this.element.classList.add("column-chart_loading");
    }
    this.data = data;
    this.subElements.body.innerHTML = this.getBody();
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.element.remove();
    this.element = "";
    this.subElements = "";
  }
}
