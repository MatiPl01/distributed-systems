import readline from "readline";

import api from "./api.js";
import {
  createNode,
  deleteNode,
  getData,
  treePaths,
  treeToJson,
} from "./utils.js";
import { createWatcher } from "./watchers.js";
import { client } from "./client.js";
import { killApp, openApp } from "./appUtils.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

client.once("connected", () => {
  console.log("Connected to ZooKeeper");
  promptUser();
});

client.connect();

const server = api.listen(3000, () => {
  console.log("🚀 REST Server listening on port 3000");
});

server.on("error", () => {});

export function promptUser() {
  rl.question("", (command) => {
    try {
      handleCommand(command);
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
    }
    promptUser();
  });
}

async function handleCommand(command) {
  const [action, znode_path, ...data] = command.split(" ");

  try {
    switch (action) {
      case "create":
        if (!znode_path) {
          throw new Error("Path is required");
        }
        let appName;
        if (znode_path === "/z") {
          appName = data.join(" ");
          if (!appName) {
            throw new Error("App name is required");
          }
        }
        try {
          createWatcher(znode_path, appName);
          await createNode(znode_path, appName);
        } catch (error) {
          console.error(`Error creating node ${znode_path}:`, error);
        }
        break;

      case "delete":
        try {
          createWatcher(znode_path, await getData(znode_path));
          await deleteNode(znode_path);
          console.log(`${znode_path} deleted.`);
        } catch (error) {
          console.error(`Error deleting node ${znode_path}:`, error);
        }
        break;

      case "tree":
        try {
          const tree = await treeToJson("/z");
          console.log(treePaths(tree).join("\n"));
        } catch {
          console.error("Tree is empty");
        }
        break;

      case "exit":
        rl.close();
        client.close();
        server.close();
        process.exit(0);

      default:
        console.log("Invalid command");
        break;
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
  }
}
