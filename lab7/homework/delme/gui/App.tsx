/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DirectedGraph,
  DirectedGraphComponent,
  PannableScalableView,
} from "react-native-smart-graph";
import { useQuery } from "react-query";

const bfs = (data: any) => {
  const queue: any[] = [];
  const visited = new Set();
  const vertices = [];
  const edges = [];

  queue.push(data);
  visited.add(data.name);

  while (queue.length) {
    const current = queue.shift();

    vertices.push({
      key: current.name,
      data: "",
    });

    for (const child of current.children) {
      if (!visited.has(child.name)) {
        visited.add(child.name);
        queue.push(child);
        edges.push({
          key: `${current.name}-${child.name}`,
          from: current.name,
          to: child.name,
          data: "",
        });
      }
    }
  }

  return { vertices, edges };
};

export default function App() {
  const { data } = useQuery(
    "repoData",
    () => fetch("http://localhost:3000/tree").then((res) => res.json()),
    {
      refetchInterval: 500,
    }
  );

  const graph = useMemo(() => new DirectedGraph({ vertices: [] }), []);

  useEffect(() => {
    if (!data?.name) {
      graph.clear();
      return;
    }

    graph.replaceBatch(bfs(data));
  }, [graph, data]);

  return (
    <SafeAreaView style={{ flex: 1, padding: 40 }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "black" }}>
        <PannableScalableView objectFit="contain" controls>
          <DirectedGraphComponent
            graph={graph}
            settings={{
              placement: {
                strategy: "trees",
                minVertexSpacing: 100,
              },
            }}
          />
        </PannableScalableView>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
