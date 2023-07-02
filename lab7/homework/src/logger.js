import { COLORS } from "./constants.js";

export default {
  log: (tag, message) =>
    console.log(`${COLORS.Cyan}[${tag}] ${message}${COLORS.Reset}`),
  warn: (tag, message) =>
    console.warn(`${COLORS.Yellow}[${tag}] ${message}${COLORS.Reset}`),
  error: (tag, message) =>
    console.error(`${COLORS.Red}[${tag}] ${message}${COLORS.Reset}`),
  debug: (tag, message) =>
    console.debug(`${COLORS.Green}[${tag}] ${message}${COLORS.Reset}`),
};
