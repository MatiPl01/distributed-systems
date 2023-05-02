import COLORS from '../constants/colors.js';

export default class Logger {
  static log(message) {
    this.#log(message);
  }

  static info(message) {
    this.#log(message, 'info');
  }

  static success(message) {
    this.#log(message, 'success');
  }

  static warn(message) {
    this.#log(message, 'warn');
  }

  static error(message) {
    this.#log(message, 'error');
  }

  static #log(message, level) {
    const timestamp = new Date().toISOString();
    let fgColor = '';
    let bgColor = '';

    switch (level) {
      case 'info':
        fgColor = COLORS.Cyan;
        break;
      case 'success':
        fgColor = COLORS.Green;
        break;
      case 'warn':
        fgColor = COLORS.Yellow;
        break;
      case 'error':
        fgColor = COLORS.Red;
        break;
      case 'critical':
        fgColor = COLORS.White;
        bgColor = COLORS.BgRed;
        break;
      default:
        break;
    }

    console.log(`${fgColor}${bgColor}[${timestamp}] ${message}${COLORS.Reset}`);
  }
}
