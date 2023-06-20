import zookeeper from "node-zookeeper-client";
import { spawn } from "child_process";
import { client } from "./client.js";

let graphical_app;

export function createWatcher(znode_path) {
  client.exists(
    znode_path,
    (event) => {
      console.log("Event:", event);

      if (event.type === zookeeper.Event.NODE_CREATED) {
        console.log("Node created." + znode_path);
        if (znode_path === "/z") {
          rl.question("Enter the graphical application name: ", (name) => {
            graphical_app = spawn(name);
          });
        }
      } else if (event.type === zookeeper.Event.NODE_DELETED) {
        if (znode_path === "/z") {
          graphical_app.kill();
          console.log("Graphical application stopped.");
        }
      } else if (event.type === zookeeper.Event.NODE_CHILDREN_CHANGED) {
        client.getChildren(znode_path, (error, children) => {
          if (error) {
            console.error("Error getting children:", error);
          } else {
            console.log(`Number of children: ${children.length}`);
          }
        });
      }
      createWatcher(znode_path);
    },
    (error) => {
      console.error("Error in watcher:", error);
      if (error) {
        console.error("Error checking node existence:", error);
      }
    }
  );
}
