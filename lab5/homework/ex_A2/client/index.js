import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

import Client from './src/services/clientService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SERVER_ADDRESS =
  `${process.env.SERVER_ADDRESS}:${process.env.SERVER_PORT}` ||
  'localhost:5061';
const PROTO_PATH = path.resolve(__dirname, './proto/air_pollution.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const airPollutionProto =
  grpc.loadPackageDefinition(packageDefinition).air_pollution;

const main = () => {
  const client = new Client(airPollutionProto);
  client.connect(SERVER_ADDRESS);
};

main();

/* Example usage:
subscribe scheduled --interval=1000 --cities=Kraków

subscribe conditional --min_pm_2_5=10 --max_pm_2_5=300 --min_pm_10=10 --max_pm_10=200 --cities=Warszawa,Wrocław,Poznań,Gdańsk

subscribe conditional --min_pm_2_5=10 --max_pm_2_5=300 --min_pm_10=10 --max_pm_10=200 --cities=Kraków,Warszawa,Białystok <-- error

subscribe conditional --min_pm_2_5=10 --max_pm_2_5=100 --cities=Kraków,Warszawa

unsubscribe <subscriptionId>
*/
