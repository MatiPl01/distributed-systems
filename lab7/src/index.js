import readline from "readline";

import api from "./api.js";
import { createNode, deleteNode } from "./utils.js";
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
    if (action === "create") {
      await createNode(znode_path, data);
      console.log(`Node ${znode_path} created with data: ${data}`);
      createWatcher(znode_path);
    } else if (action === "delete") {
      await deleteNode(znode_path);
      console.log(`${znode_path} deleted.`);
    } else {
      console.log("Invalid command.");
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
  }
}

const server = api.listen(3000, () => {
  console.log("🚀 REST Server listening on port 3000");
});
