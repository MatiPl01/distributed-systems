import zookeeper from "node-zookeeper-client";
import { spawn } from "child_process";
import { client } from "./client.js";
import { countDescendants } from "./utils.js";

let graphical_app;

export function createWatcher(znode_path, data) {
  client.exists(
    znode_path,
    async (event) => {
      if (event.type === zookeeper.Event.NODE_CREATED) {
        if (znode_path === "/z") {
          graphical_app = spawn("open", [data], {
            detached: true,
            shell: true,
          });
          console.log("Graphical application started.");
        } else {
          console.log(`Number of descendants: ${await countDescendants("/z")}`);
        }
      } else if (event.type === zookeeper.Event.NODE_DELETED) {
        if (znode_path === "/z" && graphical_app) {
          try {
            process.kill(-graphical_app.pid, "SIGTERM");
            console.log("Graphical application stopped.");
          } catch (error) {
            console.error("Error stopping graphical app:", error);
          }
        } else {
          console.log("No graphical app to stop.");
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
