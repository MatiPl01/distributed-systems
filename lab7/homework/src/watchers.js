import ZooKeeper from "zookeeper";

import logger from "./logger.js";
import { openApp, closeApp } from "./utils.js";

// Store the app name locally
let appName;

const rootZNode = "/z";

const dataChangeWatcher = (client) => {
  client.aw_get(
    rootZNode,
    function (type, state, path) {
      // Set up a new watcher every time
      dataChangeWatcher(client);

      client.a_get(path, false, function (rc, error, stat, data) {
        if (rc === ZooKeeper.ZOK) {
          appName = data.toString(); // Save the data (i.e. appName) here after data change
          logger.log("Data Watcher", `⚙️ App name updated: ${appName}`);
        }
      });
    },
    function (rc, error, stat, data) {
      if (rc === ZooKeeper.ZOK && data) {
        appName = data.toString();
        logger.log("Data Watcher", `⚙️ App name on first read: ${appName}`);
      }
    }
  );
};

export const watchRootNode = (client) => {
  dataChangeWatcher(client); // Set up a data watcher immediately after setting up exists/watcher
  watchDescendants(client);

  client.aw_exists(
    rootZNode,
    function (type, state, path) {
      logger.debug("Watcher", `Watcher for root node ${path} triggered`);

      // Set up a new watcher every time
      watchRootNode(client);

      if (type === ZooKeeper.ZOO_CREATED_EVENT) {
        logger.log("Watcher", `Root node ${path} is created.`);

        client.a_get(path, false, function (rc, error, stat, data) {
          if (rc === ZooKeeper.ZOK) {
            if (!data) {
              logger.error(
                "App",
                "App name is not set. Please set it in the root node"
              );
              return;
            }
            const appName = data.toString();
            logger.log("App", `Opening app: ${appName}`);
            openApp(appName);
          }
        });
      } else if (type === ZooKeeper.ZOO_DELETED_EVENT) {
        logger.log("Watcher", `❌ Root node ${path} is deleted`);
        if (!appName) {
          logger.warn("App", "App name is not set. No app to close");
          return;
        }
        closeApp(appName);
      }
    },
    function (rc, error, stat) {
      if (rc === ZooKeeper.ZNONODE) {
        logger.warn("Watcher", "Root node does not exist. Let's wait");
      } else if (rc === ZooKeeper.ZOK) {
        logger.log("Watcher", "Root node exists");
      } else {
        logger.warn(
          "Watcher",
          `Error occurred when checking exists for ${rootZNode}: ${error}`
        );
      }
    }
  );
};

const watchDescendants = (client, path = rootZNode) => {
  const watcher = async (type, state, path) => {
    if (type === ZooKeeper.ZOO_DELETED_EVENT) {
      return;
    }
    const count = await countDescendants(client, rootZNode);
    logger.log(
      "Watcher",
      `There are ${count} descendants of ${rootZNode} (${path})`
    );
    watchDescendants(client, path);
  };

  client.aw_get_children(path, watcher, (rc, error, children) => {
    if (rc === ZooKeeper.ZOK) {
      children.forEach((child) => {
        const childPath = `${path}/${child}`;
        // Check if child node still exists before setting watch
        client.a_exists(childPath, false, (rc, error) => {
          if (rc === ZooKeeper.ZOK) {
            watchDescendants(client, childPath);
          }
        });
      });
    }
  });
};

const countDescendants = (client, path = rootZNode) => {
  return new Promise((resolve, reject) => {
    client.aw_get_children(
      path,
      () => {},
      (rc, error, children) => {
        if (rc === ZooKeeper.ZOK) {
          let promises = [];
          children.forEach((child) => {
            const childPath = `${path}/${child}`;
            promises.push(countDescendants(client, childPath));
          });
          Promise.all(promises)
            .then((childCounts) =>
              resolve(
                // If we're at the root node, don't increment the counter
                path === rootZNode
                  ? childCounts.reduce((a, b) => a + b, 0)
                  : 1 + childCounts.reduce((a, b) => a + b, 0)
              )
            )
            .catch(reject);
        } else if (rc === ZooKeeper.ZNONODE) {
          // If node does not exist, resolve as zero without rejecting
          resolve(0);
        } else {
          reject(error);
        }
      }
    );
  });
};
