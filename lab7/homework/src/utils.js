import ZooKeeper from "zookeeper";
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

export const printSubtree = (client, path, level = 0) => {
  return new Promise((resolve, reject) => {
    client.aw_get_children(
      path,
      () => {},
      (rc, error, children) => {
        if (rc === ZooKeeper.ZOK) {
          let promises = [];
          // Convert children nodes into a tree of Promises
          children.forEach((child) => {
            const childPath = `${path}/${child}`;
            promises.push(printSubtree(client, childPath, level + 1));
          });
          Promise.all(promises)
            // Structure the current node path and its children into the tree
            .then((subtrees) => {
              let str = `\n${" ".repeat(level * 2)}${path.split("/").pop()}`;
              subtrees.forEach((subtree) => {
                str += subtree;
              });
              resolve(str);
            })
            .catch(reject);
        } else if (rc === ZooKeeper.ZNONODE) {
          // If node does not exist, resolve an empty string
          resolve("");
        } else {
          reject(error);
        }
      }
    );
  });
};
