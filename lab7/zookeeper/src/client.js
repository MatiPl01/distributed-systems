import zookeeper from "node-zookeeper-client";

export const client = zookeeper.createClient("localhost:2181");
