export const globalStore = { activeNotification: null };
export default class NotificationMessage {
  constructor(msg = "Hello World", { duration = 2000, type = "success" } = {}) {
    this.message = msg;
    this.duration = duration;
    this.type = type;
    this.render();
  }

  get template() {
    return `<div class="notification ${this.type}" style="--value:${
      this.duration / 1000
    }s">
    <div class="timer"></div>
    <div class="inner-wrapper">
      <div class="notification-header">${this.type}</div>
      <div class="notification-body">
         ${this.message}
      </div>
    </div>
  </div>`;
  }
  render() {
    const wrap = document.createElement("div");
    wrap.innerHTML = this.template;
    this.element = wrap.firstElementChild;
  }
  show(parent = document.body) {
    this.clearActive();
    globalStore.activeNotification = this;
    parent.append(this.element);
    setTimeout(this.remove.bind(this), this.duration);
  }
  remove() {
    if (this.element) {
      this.element.remove();
    }
    if (globalStore.activeNotification === this) {
      globalStore.activeNotification = null;
    }
  }

  clearActive() {
    if (globalStore.activeNotification) {
      globalStore.activeNotification.remove();
    }
    globalStore.activeNotification = null;
  }
  destroy() {
    this.remove();
    this.clearActive();
  }
}
