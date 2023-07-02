import zookeeper from 'node-zookeeper-client';

const client = zookeeper.createClient('localhost:2181');

const createWatchers = () => {
  console.log('👀 Watchers successfully created!');
};

client.once('connected', () => {
  console.log('🚀 Connected to ZooKeeper!');
  // Create watchers
  createWatchers();
});

export default client;
