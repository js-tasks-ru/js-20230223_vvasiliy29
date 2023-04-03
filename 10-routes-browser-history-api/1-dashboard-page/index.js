import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
  constructor () {
    this.factoryComponents();

  }

  get chartsSettings () {
    return {
      ordersChart: {
        url: 'api/dashboard/orders',
        label: 'orders',
        link: '#'
      },
      salesChart: {
        url: 'api/dashboard/sales',
        label: 'sales',
        formatHeading: data => `$${data}`
      },
      customersChart: {
        url: 'api/dashboard/customers',
        label: 'customers',
      }
    };
  }

  get template () {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <!-- RangePicker component -->
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Best sellers</h3>

      <div data-element="sortableTable">
        <!-- sortable-table component -->
      </div>
    </div>`;
  }

  renderComponents () {
    for (const [componentName, component] of Object.entries(this.components)) {
      this.subElements[componentName].append(component.element);
    }
  }

  async loadTableData (from, to) {
    this.sortableTable.url.searchParams.set('_from', from);
    this.sortableTable.url.searchParams.set('_to', to);
    this.sortableTable.element.classList.add('sortable-table_loading');
    const data = await fetchJson(this.sortableTable.url.toString());

    this.sortableTable.element.classList.remove('sortable-table_loading');

    return data;
  }

  render () {
    const wrap = document.createElement('div');
    wrap.innerHTML = this.template;
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.renderComponents();
    this.initListeners();
    return this.element;
  }

  factoryComponents () {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - 1, 1);
    const range = { from, to };

    const columnCharts = Object.keys(this.chartsSettings).reduce((acc, chart) => {
      const settings = { ...this.chartsSettings[chart], range };
      acc[chart] = new ColumnChart(settings);
      return acc;
    }, {});
    const rangePicker = new RangePicker(range);
    const sortableTable = new SortableTable(header, {
      url: `api/dashboard/bestsellers?from=${from.toISOString()}&to=${to.toISOString()}`,
      isSortLocally: true,
    });

    this.components = { ...columnCharts, rangePicker, sortableTable };
  }

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, el) => {
      acc[el.dataset.element] = el;
      return acc;
    }, {});
  }

  onDateSelect (e) {
    const { from, to } = e.detail;
    this.updateComponents(from, to);

  }

  async updateComponents (from, to) {
    const { sortableTable: tableComponent } = this.components;
    const tableData = await this.loadTableData(from, to);
    tableComponent.renderRows(tableData);
    Object.keys(this.chartsSettings).forEach((chart) => {
      this.components[chart].update(from, to);
    });
  }

  loadTableData (from, to) {
    const { sortableTable: tableComponent } = this.components;
    const { id: tableSort, order: tableOrder } = tableComponent.sorted;
    tableComponent.url.searchParams.set('from', from.toISOString());
    tableComponent.url.searchParams.set('to', to.toISOString());
    return tableComponent.loadData(tableSort, tableOrder);
  }

  async updateSortableTable (from, to) {
    const tableData = await this.loadTableData(from.toISOString(), to.toISOString());
    console.log(tableData);

  }

  initListeners () {
    const { rangePicker: rangePickerComponent } = this.components;
    rangePickerComponent.element.addEventListener('date-select', (e) => {this.onDateSelect(e);});
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.remove();
    Object.values(this.components).forEach(component => {
      component.destroy();
    });
    this.components = {};
  }
}
