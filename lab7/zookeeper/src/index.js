import readline from "readline";

import api from "./api.js";
import { createNode, deleteNode, treePaths, treeToJson } from "./utils.js";
import { createWatcher } from "./watchers.js";
import { client } from "./client.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

client.once("connected", () => {
  console.log("Connected to ZooKeeper.");
  createWatcher("/");
  promptUser();
});

client.connect();

export function promptUser() {
  rl.question("", (command) => {
    handleCommand(command);
    promptUser();
  });
}

async function handleCommand(command) {
  const [action, znode_path, data] = command.split(" ");

  try {
    switch (action) {
      case "create":
        if (!znode_path) {
          throw new Error("Path is required.");
        }
        if (znode_path === "/z" && !data) {
          throw new Error("App name is required for /z znode.");
        }
        createWatcher(znode_path, data);
        await createNode(znode_path, data);
        break;
      case "delete":
        createWatcher(znode_path);
        await deleteNode(znode_path);
        console.log(`${znode_path} deleted.`);
        break;
      case "tree":
        const tree = await treeToJson("/");
        console.log(treePaths(tree).join("\n"));
        break;
      case "exit":
        rl.close();
        client.close();
        api.close();
        process.exit(0);
      default:
        console.log("Invalid command.");
        break;
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
  }
}

const server = api.listen(3000, () => {
  console.log("🚀 REST Server listening on port 3000");
});
