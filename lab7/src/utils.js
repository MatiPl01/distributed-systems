import zookeeper from "node-zookeeper-client";
import { client } from "./client.js";

export async function createNode(path, data = "") {
  const bufferData = Buffer.from(data);

  return new Promise((resolve, reject) => {
    client.create(
      path,
      bufferData,
      zookeeper.CreateMode.PERSISTENT,
      (error, actualPath) => {
        if (error) {
          console.error("Error creating node:", error);
          reject(error);
        } else {
          console.log(`Node created at path: ${actualPath}`);
          resolve(actualPath);
        }
      }
    );
  });
}

export async function deleteNode(path) {
  return new Promise((resolve, reject) => {
    client.remove(path, (error) => {
      if (error) {
        console.error("Error deleting node:", error);
        reject(error);
      } else {
        console.log(`Node at path ${path} deleted.`);
        resolve();
      }
    });
  });
}

export async function treeToJson(path) {
  const result = {};

  return new Promise(async (resolve, reject) => {
    client.getData(path, async (error, data) => {
      if (error) {
        reject(error);
      } else {
        result.name = path;
        result.data = data.toString();
        result.children = [];

        const children = await getChildren(path);
        if (children.length > 0) {
          const promises = children.map((child) =>
            treeToJson(`${path !== "/" ? path : ""}/${child}`)
          );
          const childResults = await Promise.all(promises);
          result.children = childResults;
          resolve(result);
        } else {
          resolve(result);
        }
      }
    });
  });
}

async function getChildren(path) {
  return new Promise((resolve, reject) => {
    client.getChildren(path, (error, children) => {
      if (error) {
        reject(error);
      } else {
        resolve(children);
      }
    });
  });
}
