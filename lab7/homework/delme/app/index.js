/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import client from './src/zookeeper';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
