import express from "express";
import { treeToJson } from "./utils.js";
import { client } from "./client.js";

const api = express();

api.get("/tree", async (_, res) => {
  try {
    const tree = await treeToJson("/");
    res.json(tree);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default api;
