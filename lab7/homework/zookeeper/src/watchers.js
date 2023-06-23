import zookeeper from "node-zookeeper-client";
import { client } from "./client.js";
import { countDescendants } from "./utils.js";
import { killApp, openApp } from "./appUtils.js";

let openedAppName;

export function createWatcher(znode_path, appName) {
  client.exists(
    znode_path,
    async (event) => {
      if (event.type === zookeeper.Event.NODE_CREATED) {
        if (znode_path === "/z") {
          openedAppName = appName;
          openApp(appName);
          console.log("Graphical application started");
        } else {
          client.exists("/z", async (_, stat) => {
            if (stat) {
              console.log(
                `Number of descendants: ${await countDescendants("/z")}`
              );
            }
          });
        }
      } else if (event.type === zookeeper.Event.NODE_DELETED) {
        if (znode_path === "/z" && openedAppName) {
          if (!openedAppName) {
            console.error("No graphical app to stop");
            return;
          }
          try {
            killApp(openedAppName);
            openedAppName = null;
            console.log("Graphical application stopped");
          } catch (error) {
            console.error("Error stopping graphical app:", error);
          }
        } else {
          console.log("No graphical app to stop");
        }
      }
    },
    (error) => {
      if (error) {
        console.error("Error checking node existence:", error);
      }
    }
  );
}
