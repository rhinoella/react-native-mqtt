import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import type { PublishOptions } from './PublishOptions';
import type { MqttOptions } from './MqttOptions';
import type { MqttSubscription } from './MqttSubscription';

export type NativeMqtt = {
  addListener(eventName?: string): Promise<void>;
  removeListeners(count?: number): Promise<void>;
  createClient(options: MqttOptions): Promise<string>;
  connect(clientRef: string | undefined): Promise<void>;
  disconnect(clientRef: string | undefined): Promise<void>;
  reconnect(clientRef: string | undefined): Promise<void>;
  isConnected(clientRef: string | undefined): Promise<boolean>;
  subscribe(
    topics: MqttSubscription[],
    clientRef: string | undefined
  ): Promise<void>;
  unsubscribe(topics: string[], clientRef: string | undefined): Promise<void>;
  publish(
    topic: string,
    payload: string,
    options: PublishOptions,
    clientRef: string | undefined
  ): Promise<void>;
  end(clientRef: string | undefined, force: Boolean): Promise<void>;
};

const LINKING_ERROR =
  `The package 'react-native-mqtt' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

export const MqttNative = NativeModules.Mqtt
  ? NativeModules.Mqtt
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const MqttEventEmitter = () => new NativeEventEmitter(MqttNative);
