import { exec } from "child_process";

import logger from "./logger.js";

export const openApp = (appName) => {
  let command;

  logger.log("App", `Launching app: ${appName}...`);

  switch (process.platform) {
    case "darwin":
      command = `open -a "${appName}"`;
      break;
    case "win32":
      command = `start "${appName}"`;
      break;
    case "linux":
      command = `"${appName}" &`;
      break;
    default:
      logger.error("Platform", "Unsupported platform");
      return;
  }

  exec(command, (err) => {
    if (err) {
      logger.error("App", `Error trying to launch app: ${err}`);
    } else {
      logger.log("App", `🚀 App launched: ${appName}`);
    }
  });
};

export const closeApp = (appName) => {
  let command;

  logger.log("App", `Closing app: ${appName}...`);

  switch (process.platform) {
    case "darwin":
    case "linux":
      command = `pkill -f "${appName}"`;
      break;
    case "win32":
      command = `taskkill /im "${appName}" /f`;
      break;
    default:
      logger.error("Platform", "Unsupported platform");
      return;
  }

  exec(command, (err) => {
    if (err) {
      logger.error("App", `Error trying to close app: ${err}`);
    } else {
      logger.log("App", `❌ App closed: ${appName}`);
    }
  });
};
