/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {QueryClient, QueryClientProvider} from 'react-query';

const queryClient = new QueryClient();

AppRegistry.registerComponent(appName, () => () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
));
