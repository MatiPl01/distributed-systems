import { format } from 'date-fns';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

import * as grpc from '@grpc/grpc-js';

import { INPUT_CONFIG } from '../config/index.js';
import Logger from '../utils/Logger.js';
import InputParser from '../utils/inputParser.js';
import { protoTimestampToJsDate } from '../utils/protoUtils.js';

export default class Client {
  constructor(proto) {
    this.proto = proto;
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.inputParser = new InputParser(INPUT_CONFIG);

    this.subscriptions = {};
  }

  connect(serverAddress) {
    Logger.info(`Connecting to server at ${serverAddress}...`);
    const AirPollutionNotifier = this.proto.AirPollutionNotifier;

    Logger.info('Waiting for user input...');
    this.handleInput(
      new AirPollutionNotifier(serverAddress, grpc.credentials.createInsecure())
    );
  }

  handleInput(client) {
    this.readlineInterface.on('line', line => {
      const parsedInput = this.inputParser.parseInput(line);
      if (!parsedInput) return;

      const { command, arg, options } = parsedInput;

      switch (command) {
        case 'subscribe':
          const subscriptionId = uuidv4();
          const subscription = this.handleSubscribe(client, arg, options);
          this.subscriptions[subscriptionId] = subscription;
          Logger.info(
            `Subscription with id ${subscriptionId} has been created.`
          );
          this.handleSubscribeResponse(subscriptionId, subscription);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(arg);
          break;
      }
    });
  }

  handleSubscribe(client, arg, options) {
    let subscription = null;

    switch (arg) {
      case 'scheduled':
        subscription = client.SubscribeOnSchedule({
          interval: options.interval,
          cities: options.cities
        });
        break;

      case 'conditional':
        subscription = client.SubscribeOnCondition({
          cities: options.cities,
          criteria: {
            min_pm_2_5: options.min_pm_2_5,
            max_pm_2_5: options.max_pm_2_5,
            min_pm_10: options.min_pm_10,
            max_pm_10: options.max_pm_10
          }
        });
        break;
    }

    return subscription;
  }

  handleUnsubscribe(subscriptionId) {
    if (!this.subscriptions[subscriptionId]) {
      Logger.error(`Subscription with id ${subscriptionId} does not exist.`);
      return;
    }

    this.subscriptions[subscriptionId]
      .removeAllListeners()
      .once('error', () => {}) // Suppress error while closing subscription
      .cancel();

    delete this.subscriptions[subscriptionId];
    Logger.info(`Subscription with id ${subscriptionId} has been removed.`);
  }

  handleSubscribeResponse(id, response) {
    response.on('data', data => {
      Logger.info(`Subscription with id ${id} received data.`);
      this.printNotification(data);
    });
    response.on('end', () => {
      Logger.info(`Subscription with id ${id} has been closed.`);
    });
    response.on('error', error => {
      Logger.error(error);
    });
  }

  printNotification(notification) {
    const notificationDate = protoTimestampToJsDate(notification.timestamp);

    console.log(
      `[${format(
        notificationDate,
        'yyyy-MM-dd HH:mm:ss'
      )}] Notification: \n${notification.measurements
        .map(
          ({ city, pm_2_5, pm_10 }) =>
            ` - ${city}: PM 2.5: ${pm_2_5.value} (${pm_2_5.level}), PM 10: ${pm_10.value} (${pm_10.level})`
        )
        .join('\n')}`
    );
  }
}
