import ZooKeeper from "zookeeper";

import logger from "./logger.js";

let client;
let timeoutId;

function stopTimer() {
  clearTimeout(timeoutId);
}

function startTimer() {
  stopTimer();

  timeoutId = setTimeout(() => {
    throw new Error("ZooKeeper connection timeout");
  }, 10000);
}

export const createClient = (host, timeoutMs = 15000) => {
  if (client) return client;

  logger.log("client", "creating a client...");

  const config = {
    connect: host,
    timeout: timeoutMs,
    debug_level: 3,
    host_order_deterministic: false,
  };

  client = new ZooKeeper(config);

  client.on("close", () => {
    stopTimer();

    logger.debug("client", `session closed, id=${client.client_id}`);

    client = null;
  });

  client.on("connecting", () => {
    startTimer();

    logger.debug("client", `session connecting, id=${client.client_id}`);
  });

  client.on("connect", () => {
    stopTimer();

    logger.debug("client", `session connect, id=${client.client_id}`);
  });

  setTimeout(() => {
    client.init({});

    startTimer();
  }, 1000);

  return client;
};
