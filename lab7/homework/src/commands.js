import logger from "./logger.js";
import { printSubtree } from "./utils.js";

export const handleCommand = (client, command, rootNode) => {
  switch (command) {
    case "tree":
      printSubtree(client, rootNode).then(console.log);
      break;
    case "exit":
      process.exit(0);
    default:
      logger.error("Command", `Unknown command: '${command}'`);
  }
};
