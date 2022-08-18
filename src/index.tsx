import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import type { QuitoOptions } from './models/MqttOptions';
import type { MqttSubscription } from './models/MqttSubscription';
import type { PublishOptions } from './models/PublishOptions';
import { QuitoEvent } from './models/events/QuitoEvent';
import { QuitoEventParam } from './models/events/QuitoEventParam';

export * from './models/events/QuitoEvent';
export * from './models/Protocol';
export * from './models/MqttOptions';

const LINKING_ERROR =
  `The package 'quito' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const QuitoNative = NativeModules.Quito
  ? NativeModules.Quito
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * Quito is a Typescript wrapper for native MQTT clients
 *
 * @param options configuration options for the client
 */
export class Quito {
  private _options: QuitoOptions;
  private _clientRef?: string;
  private _eventHandler: any = {};
  private _eventEmitter = new NativeEventEmitter(QuitoNative);

  constructor(options: QuitoOptions) {
    this._options = options;
    console.log(JSON.stringify(this._options));
  }

  async init(): Promise<void> {
    this._clientRef = await QuitoNative.createClient(this._options);
    this._setupEventListeners();
  }

  public on(event: QuitoEvent.CONNECTED, cb: () => void): this;
  public on(event: QuitoEvent.CONNECTING, cb: () => void): this;
  public on(
    event: QuitoEvent.CONNECTION_LOST,
    cb: (errorMsg?: string, errorCode?: number, stackTrace?: string) => void
  ): this;
  public on(event: QuitoEvent.SUBSCRIBED, cb: (topic: string) => void): this;
  public on(event: QuitoEvent.UNSUBSCRIBED, cb: (topic: string) => void): this;
  public on(
    event: QuitoEvent.MESSAGE_RECEIVED,
    cb: (topic: string, payloadAsUtf8: string) => void
  ): this;
  public on(
    event: QuitoEvent.MESSAGE_PUBLISHED,
    cb: (topic: string, payloadAsUtf8: string) => void
  ): this;
  public on(event: QuitoEvent.DISCONNECTED, cb: () => void): this;
  public on(
    event: QuitoEvent.EXCEPTION,
    cb: (errorMsg?: string, errorCode?: number, stackTrace?: string) => void
  ): this;
  public on(event: QuitoEvent.CLOSED, cb: () => void): this;
  public on(event: string, cb: Function): this {
    this._eventHandler[event] = cb;
    return this;
  }

  connect(): void {
    QuitoNative.connect(this._clientRef);
  }

  async connectAsync(): Promise<void> {
    await QuitoNative.connect(this._clientRef);
  }

  disconnect(): void {
    QuitoNative.disconnect(this._clientRef);
  }

  async disconnectAsync(): Promise<void> {
    await QuitoNative.disconnect(this._clientRef);
  }

  subscribe(...topics: MqttSubscription[]): void {
    QuitoNative.subscribe([...topics], this._clientRef);
  }

  async subscribeAsync(...topics: MqttSubscription[]): Promise<void> {
    await QuitoNative.subscribe([...topics], this._clientRef);
  }

  unsubscribe(topic: string | string[]): void {
    const readableTopics = Array.from([topic].flat());
    QuitoNative.unsubscribe(readableTopics, this._clientRef);
  }

  async unsubscribeAsync(topic: string | string[]): Promise<void> {
    const readableTopics = Array.from([topic].flat());
    await QuitoNative.unsubscribe(readableTopics, this._clientRef);
  }

  publish(
    topic: string,
    payloadUtf8: string,
    options: PublishOptions = {}
  ): void {
    QuitoNative.publish(topic, payloadUtf8, options, this._clientRef);
  }

  async publishAsync(
    topic: string,
    payloadUtf8: string,
    options: PublishOptions = {}
  ): Promise<void> {
    QuitoNative.publish(topic, payloadUtf8, options, this._clientRef);
  }

  reconnect(): void {
    QuitoNative.reconnect(this._clientRef);
  }

  async isConnected(): Promise<boolean> {
    return await QuitoNative.isConnected(this._clientRef);
  }

  end(force: Boolean = false): void {
    QuitoNative.end(this._clientRef, force);
    this._removeEventListeners();
  }

  async endAsync(force: Boolean = false): Promise<void> {
    await QuitoNative.end(this._clientRef, force);
    this._removeEventListeners();
  }

  close = this.end;
  closeAsync = this.endAsync;

  private _removeEventListeners(): void {
    this._eventEmitter.removeAllListeners(QuitoEvent.CLIENT_REF_UNKNOWN);
    this._eventEmitter.removeAllListeners(QuitoEvent.CONNECTED);
    this._eventEmitter.removeAllListeners(QuitoEvent.CONNECTING);
    this._eventEmitter.removeAllListeners(QuitoEvent.CONNECTION_LOST);
    this._eventEmitter.removeAllListeners(QuitoEvent.DELIVERY_COMPLETE);
    this._eventEmitter.removeAllListeners(QuitoEvent.DISCONNECTED);
    this._eventEmitter.removeAllListeners(QuitoEvent.EXCEPTION);
    this._eventEmitter.removeAllListeners(QuitoEvent.MESSAGE_RECEIVED);
    this._eventEmitter.removeAllListeners(QuitoEvent.RECONNECT);
    this._eventEmitter.removeAllListeners(QuitoEvent.SUBSCRIBED);
    this._eventEmitter.removeAllListeners(QuitoEvent.UNSUBSCRIBED);
  }

  private _setupEventListeners(): void {
    this._addEventListener(QuitoEvent.CONNECTING);
    this._addEventListener(QuitoEvent.CONNECTED);
    this._addEventListener(
      QuitoEvent.CONNECTION_LOST,
      QuitoEventParam.ERR_MESSAGE,
      QuitoEventParam.ERR_CODE,
      QuitoEventParam.STACKTRACE
    );
    this._addEventListener(
      QuitoEvent.EXCEPTION,
      QuitoEventParam.ERR_MESSAGE,
      QuitoEventParam.ERR_CODE,
      QuitoEventParam.STACKTRACE
    );
    this._addEventListener(QuitoEvent.SUBSCRIBED, QuitoEventParam.TOPIC);
    this._addEventListener(QuitoEvent.UNSUBSCRIBED, QuitoEventParam.TOPIC);
    this._addEventListener(QuitoEvent.DISCONNECTED);
    this._addEventListener(
      QuitoEvent.MESSAGE_RECEIVED,
      QuitoEventParam.TOPIC,
      QuitoEventParam.PAYLOAD
    );
    this._addEventListener(
      QuitoEvent.MESSAGE_PUBLISHED,
      QuitoEventParam.TOPIC,
      QuitoEventParam.PAYLOAD
    );
  }

  private _addEventListener(
    eventType: QuitoEvent,
    ...eventParams: QuitoEventParam[]
  ): void {
    this._eventEmitter.addListener(eventType, (event) => {
      console.log(eventType, JSON.stringify(event));
      if (event[QuitoEventParam.CLIENT_REF] !== this._clientRef) return;

      this._eventHandler[eventType]?.call(
        this,
        ...eventParams.map((e) => event[e])
      );
    });
  }
}
