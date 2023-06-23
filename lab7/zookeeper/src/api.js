import express from "express";
import { treeToJson } from "./utils.js";

const api = express();

api.get("/tree", async (_, res) => {
  try {
    const tree = await treeToJson("/z");
    res.json(tree);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default api;
