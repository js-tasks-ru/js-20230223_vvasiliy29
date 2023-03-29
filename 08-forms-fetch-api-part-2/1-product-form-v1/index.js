import fetchJson from './utils/fetch-json.js';
import escapeHtml from './utils/escape-html.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';
const IMGUR_URL = 'https://api.imgur.com/3/image';

export default class ProductForm {
  product = {}
  categories = []
  isFormSubmitting = false

  constructor (productId, { productUrl = 'api/rest/products', categoriesUrl = 'api/rest/categories' } = {}) {
    this.productId = productId;
    this.ImagesList = new ImagesList();
    this.productUrl = new URL(productUrl, BACKEND_URL);
    this.categoriesUrl = new URL(categoriesUrl, BACKEND_URL);
    this.formFields = {
      title: '',
      description: '',
      price: 0,
      discount: 0,
      status: 1,
      quantity: 10,
      subcategory: ''
    };
  }

  async render () {
    const wrap = document.createElement('div');
    wrap.innerHTML = this.getForm();
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.subElements.productDescription.closest('div').after(this.ImagesList.element);
    this.categories = await this.loadCategoriesList();
    this.setCategoriesSelector(this.categories);
    [this.product] = await this.loadProduct(this.productId);
    this.fillForm();
    this.initListener();
    return this.element;
  }

  normalizeCategories (categories) {
    return categories.reduce((acc, parentCat) => {
      const categories = parentCat.subcategories;
      categories.map((cat) => {
        cat.parent = parentCat;
        return cat;
      });
      acc = [...acc, ...categories];
      return acc;
    }, []);

  }

  fillForm () {
    for (const [filed, defaultValue] of Object.entries(this.formFields)) {
      this.subElements.productForm.querySelector(`#${filed}`).value = this.product[filed] || defaultValue;
    }
    const { images = [] } = this.product;
    this.ImagesList.setImagesList(images);
  }

  getSubElements (element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }
    if (this.ImagesList.subElements) {
      for (const [name, element] of Object.entries(this.ImagesList.subElements)) {result[name] = element;}
    }

    return result;
  }

  async loadProduct (productId) {
    this.productUrl.searchParams.set('id', productId);
    const response = await fetchJson(this.productUrl);
    return response;
  }

  onSubmitForm = async (e) => {
    e.preventDefault();
    if (!this.isFormSubmitting) {
      this.save();
    }
  }

  async save () {
    this.isFormSubmitting = true;

    const productData = {};
    const intFields = ['price', 'discount', 'quantity', 'status'];
    const getValue = filed => escapeHtml(this.subElements.productForm.querySelector(`#${filed}`).value);
    for (const field of Object.keys(this.formFields)) {
      const value = getValue(field);
      productData[field] = intFields.includes(field) ? parseInt(value) : value;
    }
    const images = this.getImageData();
    productData.images = images;
    productData.id = this.productId;
    const params = {
      method: this.productId ? 'PATCH' : 'PUT',
      headers: {
        'Content-type': 'application/json',
      },

      body: JSON.stringify(productData)
    };
    this.productUrl.searchParams.set('id', this.productId);
    const response = await fetchJson(this.productUrl, params);

    if (this.productId) {
      this.element.dispatchEvent(new CustomEvent('product-updated', {
        detail: response
      }));
    } else {
      this.element.dispatchEvent(new CustomEvent('product-saved', {
        detail: response
      }));
    }

    this.isFormSubmitting = false;
  }

  getImageData () {
    const imagesElements = this.subElements.imageListContainer.querySelectorAll('li.sortable-list__item');
    const images = [];
    for (const element of imagesElements) {
      const url = element.querySelector('[name="url"]').value || '';
      const source = element.querySelector('[name="source"]').value || '';
      images.push({ url, source });
    }
    return images;
  }

  async loadCategoriesList () {
    const sort = 'weight';
    const refs = 'subcategory';
    this.categoriesUrl.searchParams.set('_sort', sort);
    this.categoriesUrl.searchParams.set('_refs', refs);
    const response = await fetchJson(this.categoriesUrl);
    return response;
  }

  getForm () {
    return `<div class="product-form">
                <form data-element="productForm" class="form-grid">
                    ${this.getTitleInput()}
                    ${this.getDescTextarea()}
                    ${this.getCategoriesSelect()}
                    ${this.getPriceInput()}
                    ${this.getStatusSelect()}
                    ${this.getAmount()}
                    ${this.getAction()}
                </form>
            </div>`;
  }

  getTitleInput () {
    return `<div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input id="title" required="" type="text" name="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>`;
  }

  getDescTextarea () {
    return `<div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>`;
  }

  getCategoriesSelect () {
    return `<div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select id="subcategory" class="form-control" name="subcategory">
          ${this.getSelectOptions()}
        </select>
      </div>`;
  }

  getSelectOptions (data = []) {
    return data.map(({ id, title, parent }) => `<option value="${id}">${parent.title} > ${title}</option>`).join('');
  }

  setCategoriesSelector (categories = []) {
    const normalizeCategories = this.normalizeCategories(categories);
    this.element.querySelector('[name=subcategory]').innerHTML = this.getSelectOptions(normalizeCategories);
  }

  getPriceInput () {
    return `<div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input id="price" required="" type="number" name="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input id="discount" required="" type="number" name="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>`;
  }

  getAmount () {
    return `<div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input id="quantity" required="" type="number" class="form-control" name="quantity" placeholder="1">
      </div>`;
  }

  getStatusSelect () {
    return `<div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select id="status" class="form-control" name="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>`;
  }

  getAction () {
    return `<div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>`;
  }

  initListener () {
    this.subElements.productForm.addEventListener('submit', this.onSubmitForm);
  }

  removeListener () {
    this.subElements.productForm.removeEventListener('submit', this.onSubmitForm);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
    if (this.ImagesList) {
      this.ImagesList.destroy();
    }
  }

  destroy () {
    this.remove();
    this.ImagesList = null;
    this.element = null;
    this.removeListener();
  }
}

class ImagesList {
  element

  constructor () {
    this.render();
  }

  get template () {
    return `<div class="form-group form-group__wide" data-element="sortable-list-container">
                <label class="form-label">Фото</label>
                <div data-element="imageListContainer">
                    ${this.getImagesList()}
                </div>
                <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
            </div>`;
  }

  onImagesListPointerdown = ({ target }) => {
    const deleteHandle = target.closest('[data-delete-handle]');
    if (deleteHandle) {
      target.closest('li').remove();
    }
  }
  onUploadImage = () => {
    this.subElements.inputFile.click();
  }
  onChangeFile = async ({ target }) => {
    const [file] = target.files;

    this.subElements.uploadImage.classList.add('is-loading');
    const { data } = await this.upload(file);
    this.subElements.uploadImage.classList.remove('is-loading');

    const { link: url } = data;
    const { name: source } = file;
    this.addImage({ url, source });
    target.value = '';
  }

  render () {
    const wrap = document.createElement('div');
    wrap.innerHTML = this.template;
    this.element = wrap.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.crateInputFileElement();
    this.initListeners();
  }

  getImagesList (images = []) {
    return `<ul class="sortable-list">
                ${images.map((image) => this.getImageLi(image)).join('')}
            </ul>`;
  }

  getImageLi ({ url, source }) {
    return `<li class="products-edit__imagelist-item sortable-list__item" style="">
                <input type="hidden" name="url" value="${url}">
                <input type="hidden" name="source" value="${source}">
                <span>
                    <img src="icon-grab.svg" data-grab-handle="" alt="grab">
                    <img class="sortable-table__cell-img" alt="Image" src="${url}">
                    <span>${source}</span>
                </span>
                <button type="button">
                    <img src="icon-trash.svg" data-delete-handle="" alt="delete">
                </button>
             </li>`;
  }

  getSubElements (element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }
    result.uploadImage = element.querySelector('[name=uploadImage]');

    return result;
  }

  setImagesList (images) {
    this.subElements.imageListContainer.innerHTML = this.getImagesList(images);
  }

  addImage (data) {
    const wrap = document.createElement('div');
    wrap.innerHTML = this.getImageLi(data);
    this.subElements.imageListContainer.querySelector('ul').append(wrap.firstElementChild);
  }

  async upload (file) {
    const formData = new FormData();
    formData.append('image', file);
    const params = {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },

      body: formData,
      referrer: ''
    };
    const response = await fetchJson(IMGUR_URL, params);
    return response;

  }

  crateInputFileElement () {
    const label = document.createElement('label');
    label.innerHTML = `<input type="file" accept="image/*" />`;
    this.subElements.inputFile = label.firstElementChild;
  }

  initListeners () {
    this.subElements.imageListContainer.addEventListener('pointerdown', this.onImagesListPointerdown);
    this.subElements.uploadImage.addEventListener('pointerdown', this.onUploadImage);
    this.subElements.inputFile.addEventListener('change', this.onChangeFile);
  }

  removeListeners () {
    this.subElements.imageListContainer.removeEventListener('pointerdown', this.onImagesListPointerdown);
    this.subElements.uploadImage.removeEventListener('pointerdown', this.onUploadImage);
    this.subElements.inputFile.removeEventListener('change', this.onChangeFile);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy () {
    this.remove();
    this.element = null;
    this.removeListeners();
  }
}
