/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  DevelopmentExample,
  DirectedGraph,
  DirectedGraphComponent,
  GraphView,
  GraphViewControls,
} from 'react-native-smart-graph';

export default function App() {
  const graph = useMemo(
    () =>
      new DirectedGraph({
        vertices: [{key: 'z'}],
      }),
    [],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <GraphView>
        <DirectedGraphComponent
          graph={graph}
          settings={{
            placement: {
              strategy: 'trees',
            },
          }}
        />
        <View style={styles.controls}>
          <GraphViewControls />
        </View>
      </GraphView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    top: 64,
    right: 8,
  },
});
