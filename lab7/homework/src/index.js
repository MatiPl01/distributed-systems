import "dotenv/config";
import readline from "readline";

import logger from "./logger.js";
import { createClient } from "./client.js";
import { watchDataChanges, watchDescendants, watchNode } from "./watchers.js";
import { handleCommand } from "./commands.js";
import { ROOT_NODE } from "./constants.js";

const rl = readline.createInterface({
  input: process.stdin,
});

export function promptUser(client, rootNode) {
  rl.question("", (command) => {
    try {
      handleCommand(client, command, rootNode);
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
    }
    promptUser(client, rootNode);
  });
}

const client = createClient(process.env.ZOOKEEPER_HOST);

client.on("connect", () => {
  logger.log("Client", "📶 Connected to zookeeper!");
  // Watch for changes in the root node (create/delete)
  watchNode(client, ROOT_NODE);
  // Watch for changes in the data of the root node (app name)
  watchDataChanges(client, ROOT_NODE);
  // Watch for changes in the descendants of the root node (descendants count)
  watchDescendants(client, ROOT_NODE);

  // Prompt user for the tree command
  promptUser(client, ROOT_NODE);
});
