import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class ColumnChart {
  element
  chartHeight = 50
  data = {}

  constructor ({ url = '', range = {}, label = '', link = '', formatHeading = (data) => data } = {}) {
    this.pathname = url;
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    const { from, to } = this.range;
    this.render();
    this.update(from, to);
  }

  getChart () {
    return `<div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
                <div class="column-chart__title">
                    ${this.label}
                    ${this.getLink()}
                </div>
                <div class="column-chart__container">
                    <div data-element="header" class="column-chart__header"></div>
                    <div data-element="body" class="column-chart__chart"></div>
                </div>
            </div>`;
  }

  getLink () {
    return this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : ``;
  }

  getSubElements () {
    const result = {};
    const elements = this.element.querySelectorAll('[data-element]');
    for (const el of elements) {
      result[el.dataset.element] = el;
    }
    return result;
  }

  async update (from = new Date(), to = new Date()) {
    this.element.classList.add('column-chart_loading');
    const data = await this.loadData(from, to) || {};
    if (Object.keys(data).length) {
      const [header, body] = this.getContainer(data);
      this.subElements.header.innerHTML = header;
      this.subElements.body.innerHTML = body;
      this.element.classList.remove('column-chart_loading');
    }
    return data;
  }

  getContainer (data = {}) {
    let header = 0;

    const maxValue = Math.max(...Object.values(data));
    const scale = this.chartHeight / maxValue;

    const body = Object.values(data)
      .map((item) => {
        header += item;
        const percent = ((item / maxValue) * 100).toFixed(0) + '%';
        const value = String(Math.floor(item * scale));
        return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
      }).join('');

    return [this.formatHeading(header), body];
  }

  async loadData (from, to) {
    const url = new URL(this.pathname, BACKEND_URL);
    url.searchParams.append('to', to.toISOString());
    url.searchParams.append('from', from.toISOString());

    this.data = await fetchJson(url);
    return this.data;
  }

  render () {
    const wrap = document.createElement('div');
    wrap.innerHTML = this.getChart();
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements();
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
