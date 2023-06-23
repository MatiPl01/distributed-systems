import zookeeper from "node-zookeeper-client";
import { client } from "./client.js";

export async function createNode(path, data = "") {
  return new Promise((resolve, reject) => {
    client.create(
      path,
      Buffer.from(data),
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
  await deleteNodeHelper(path);
}

const deleteNodeHelper = (path) => {
  // Recursive function to delete all children of a node
  return new Promise((resolve, reject) => {
    getChildren(path).then(async (children) => {
      for (let child of children) {
        await deleteNodeHelper(`${path}/${child}`);
      }
      client.remove(path, (error) => {
        if (error) {
          console.error(`Error deleting node ${path}:`, error);
          reject(error);
        } else {
          console.log(`Node deleted at path: ${path}`);
          resolve();
        }
      });
    });
  });
};

export async function treeToJson(path) {
  const result = {};

  return new Promise(async (resolve, reject) => {
    client.getData(path, async (error, data) => {
      if (error) {
        reject(error);
      } else {
        result.name = path?.split("/").pop();
        result.data = data.toString();
        result.children = [];

        if (!result.name) {
          return resolve({});
        }

        const children = await getChildren(path);
        if (children.length > 0) {
          const promises = children.map((child) =>
            treeToJson(`${path !== "/" ? path : ""}/${child}`)
          );
          const childResults = await Promise.all(promises);
          result.children = childResults;
        }
        resolve(result);
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

export function treePaths(tree) {
  const paths = [];
  const path = [];
  treePathsHelper(tree, paths, path);
  return paths;
}

function treePathsHelper(tree, paths, path) {
  path.push(tree.name.split("/").pop());
  if (tree.children.length === 0) {
    paths.push(path.join("/"));
  } else {
    tree.children.forEach((child) => {
      treePathsHelper(child, paths, path.slice());
    });
  }
}

export async function countDescendants(path) {
  let count = 0;

  return new Promise((resolve, reject) => {
    client.getChildren(path, async (error, children) => {
      if (error) {
        reject(error);
      } else {
        count += children.length;
        if (children.length > 0) {
          const promises = children.map((child) =>
            countDescendants(`${path !== "/" ? path : ""}/${child}`)
          );
          const childCounts = await Promise.all(promises);
          childCounts.forEach((childCount) => (count += childCount));
        }
        resolve(count);
      }
    });
  });
}
