import { mockMqttNative } from './__mocks__/MqttNative.mock';
import { mockEmitter } from './__mocks__/NativeEventEmitter.mock';

jest.mock('../models/NativeMqtt', () => ({
  MqttNative: mockMqttNative,
  MqttEventEmitter: () => mockEmitter,
}));

import { Protocol, MqttClient, MqttEvent } from '../index';
import type { MqttOptions } from '../index';
import { MqttEventParam } from '../models/events/MqttEventParam';
import type { MqttSubscription } from '../models/MqttSubscription';

describe('instantiate native Mqtt', () => {
  it('instantiates a Mqtt instance with mocks', () => {
    const mqttClient = new MqttClient({});
    expect((mqttClient as any)._eventEmitter.isTestEventEmitter).toBeTruthy();
  });

  it('creates a native Mqtt client with given options', (done) => {
    const options: MqttOptions = {
      clientId: 'test-client-23f78ee01a',
      host: 'test.mosquitto.org',
      port: 8080,
      protocol: Protocol.WS,
    };
    const mqttClient = new MqttClient(options);
    expect(mockMqttNative.options).toBeUndefined();
    mqttClient.init().then(() => {
      expect(mockMqttNative.options).toEqual(options);
      done();
    });
  });
});

describe('connect, subscribe, publish', () => {
  let mqttClient: MqttClient;

  beforeEach((done) => {
    mqttClient = new MqttClient({
      clientId: 'test-client-23f78ee01a',
      host: 'test.mosquitto.org',
      port: 8080,
      protocol: Protocol.WS,
    });
    mqttClient.init().then(done);
  });

  afterEach(() => {
    mockMqttNative.resetMock();
    mockEmitter.resetMock();
  });

  it('passes a connection prompt to native Mqtt', () => {
    expect(mockMqttNative.connectionState).toBe(false);
    mqttClient.connect();
    expect(mockMqttNative.connectionState).toBe(true);
  });

  it('passes an async connection prompt to native Mqtt', (done) => {
    expect(mockMqttNative.connectionState).toBe(false);
    mqttClient.connectAsync().then(() => {
      expect(mockMqttNative.connectionState).toBe(true);
      done();
    });
  });

  it('passes a reconnection prompt to native Mqtt', () => {
    expect(mockMqttNative.connectionState).toBe(false);
    mqttClient.reconnect();
    expect(mockMqttNative.connectionState).toBe(true);
  });

  it('passes a disconnect prompt to native Mqtt', () => {
    mockMqttNative.connectionState = true;
    mqttClient.disconnect();
    expect(mockMqttNative.connectionState).toBe(false);
  });

  it('passes an async connection prompt to native Mqtt', (done) => {
    mockMqttNative.connectionState = true;
    mqttClient.disconnectAsync().then(() => {
      expect(mockMqttNative.connectionState).toBe(false);
      done();
    });
  });

  it('passes on subscription to one topic', () => {
    const sub: MqttSubscription = { topic: 'first/topic/#', qos: 0 };
    mqttClient.subscribe(sub);
    expect(mockMqttNative.subscriptions).toEqual([sub]);
  });

  it('passes on async subscription to one topic', (done) => {
    const sub: MqttSubscription = { topic: 'first/topic/#', qos: 0 };
    mqttClient.subscribeAsync(sub).then(() => {
      expect(mockMqttNative.subscriptions).toEqual([sub]);
      done();
    });
  });

  it('passes on subscription to an array of topics', () => {
    const subs: MqttSubscription[] = [
      { topic: 'first/topic/#', qos: 0 },
      { topic: 'second/topic/#', qos: 2 },
    ];
    mqttClient.subscribe(...subs);
    expect(mockMqttNative.subscriptions).toEqual(subs);
  });

  it('passes on async subscription to an array of topics', (done) => {
    const subs: MqttSubscription[] = [
      { topic: 'first/topic/#', qos: 0 },
      { topic: 'second/topic/#', qos: 2 },
    ];
    mqttClient.subscribeAsync(...subs).then(() => {
      expect(mockMqttNative.subscriptions).toEqual(subs);
      done();
    });
  });

  it('passes on unsubscription from one topic', () => {
    const sub: MqttSubscription = { topic: 'first/topic/#', qos: 0 };
    mockMqttNative.subscriptions.push(sub);
    mqttClient.unsubscribe(sub.topic);
    expect(mockMqttNative.subscriptions).toEqual([]);
  });

  it('passes on async subscription to one topic', (done) => {
    const sub: MqttSubscription = { topic: 'first/topic/#', qos: 0 };
    mockMqttNative.subscriptions.push(sub);
    mqttClient.unsubscribeAsync(sub.topic).then(() => {
      expect(mockMqttNative.subscriptions).toEqual([]);
      done();
    });
  });

  it('passes on subscription to an array of topics', () => {
    const subs: MqttSubscription[] = [
      { topic: 'first/topic/#', qos: 0 },
      { topic: 'second/topic/#', qos: 2 },
    ];
    mockMqttNative.subscriptions.push(...subs);
    mqttClient.unsubscribe(subs.map((s) => s.topic));
    expect(mockMqttNative.subscriptions).toEqual([]);
  });

  it('passes on async subscription to an array of topics', (done) => {
    const subs: MqttSubscription[] = [
      { topic: 'first/topic/#', qos: 0 },
      { topic: 'second/topic/#', qos: 2 },
    ];
    mockMqttNative.subscriptions.push(...subs);
    mqttClient.unsubscribeAsync(subs.map((s) => s.topic)).then(() => {
      expect(mockMqttNative.subscriptions).toEqual([]);
      done();
    });
  });

  it('forwards a message to publish', () => {
    mqttClient.publish('test/topic', Buffer.from('Test', 'utf-8'), {
      retain: false,
      qos: 0,
    });
    expect(mockMqttNative.publishedMessages).toEqual([
      {
        topic: 'test/topic',
        payloadBase64: 'VGVzdA==',
        publishOptions: { retain: false, qos: 0 },
      },
    ]);
  });

  it('asynchronously forwards a message to publish', (done) => {
    mqttClient
      .publishAsync('test/topic', Buffer.from('Test', 'utf-8'), {
        retain: false,
        qos: 0,
      })
      .then(() => {
        expect(mockMqttNative.publishedMessages).toEqual([
          {
            topic: 'test/topic',
            payloadBase64: 'VGVzdA==',
            publishOptions: { retain: false, qos: 0 },
          },
        ]);
        done();
      });
  });

  it('shuts down a Mqtt client', () => {
    mockMqttNative.connectionState = true;
    mqttClient.end();
    expect(mockMqttNative.connectionState).toBe(false);
  });

  it('asynchronously shuts down a Mqtt client', (done) => {
    mockMqttNative.connectionState = true;
    mqttClient.endAsync().then(() => {
      expect(mockMqttNative.connectionState).toBe(false);
      done();
    });
  });

  it('closes a Mqtt client', () => {
    mockMqttNative.connectionState = true;
    mqttClient.close();
    expect(mockMqttNative.connectionState).toBe(false);
  });

  it('asynchronously closes a Mqtt client', (done) => {
    mockMqttNative.connectionState = true;
    mqttClient.closeAsync().then(() => {
      expect(mockMqttNative.connectionState).toBe(false);
      done();
    });
  });

  it("reports the native client's connection state", (done) => {
    mqttClient.isConnected().then((connected) => {
      expect(connected).toBe(false);
      mockMqttNative.connectionState = true;
      mqttClient.isConnected().then((connected) => {
        expect(connected).toBe(true);
        done();
      });
    });
  });
});

describe('events', () => {
  const baseParams = { [MqttEventParam.CLIENT_REF]: 'test-client' };

  let mqttClient: MqttClient;

  beforeEach((done) => {
    mqttClient = new MqttClient({
      clientId: 'test-client-23f78ee01a',
      host: 'test.mosquitto.org',
      port: 8080,
      protocol: Protocol.WS,
    });
    mqttClient.init().then(done);
  });

  afterEach(() => {
    mockMqttNative.resetMock();
    mockEmitter.resetMock();
  });

  it('discards event if clientRef does not match', () => {
    mqttClient.on(MqttEvent.CONNECTING, () => {
      throw Error('');
    });
    mockEmitter.triggerEvent(MqttEvent.CONNECTING, {
      [MqttEventParam.CLIENT_REF]: 'unknown-client',
    });
  });

  it('calls connecting callback', (done) => {
    mqttClient.on(MqttEvent.CONNECTING, done);
    mockEmitter.triggerEvent(MqttEvent.CONNECTING, baseParams);
  });

  it('calls connected callback', (done) => {
    mqttClient.on(MqttEvent.CONNECTED, done);
    mockEmitter.triggerEvent(MqttEvent.CONNECTED, baseParams);
  });

  it('calls connectionLost callback', (done) => {
    const reason = {
      [MqttEventParam.ERR_MESSAGE]: 'Error Message',
      [MqttEventParam.ERR_CODE]: 99,
      [MqttEventParam.STACKTRACE]: 'Stack\tTrace',
    };
    mqttClient.on(
      MqttEvent.CONNECTION_LOST,
      (errMsg?: string, errCode?: number, stackTrace?: string) => {
        expect(errMsg).toBe(reason[MqttEventParam.ERR_MESSAGE]);
        expect(errCode).toBe(reason[MqttEventParam.ERR_CODE]);
        expect(stackTrace).toBe(reason[MqttEventParam.STACKTRACE]);
        done();
      }
    );
    mockEmitter.triggerEvent(MqttEvent.CONNECTION_LOST, {
      ...baseParams,
      ...reason,
    });
  });

  it('calls subscribed callback', (done) => {
    const sub = { topic: 'test/topic/#', qos: 0 };
    mqttClient.on(MqttEvent.SUBSCRIBED, (topic: string) => {
      expect(topic).toBe(sub.topic);
      done();
    });
    mockEmitter.triggerEvent(MqttEvent.SUBSCRIBED, {
      ...baseParams,
      [MqttEventParam.TOPIC]: sub.topic,
    });
  });

  it('calls unsubscribed callback', (done) => {
    const sub = { topic: 'test/topic/#', qos: 0 };
    mqttClient.on(MqttEvent.UNSUBSCRIBED, (topic: string) => {
      expect(topic).toBe(sub.topic);
      done();
    });
    mockEmitter.triggerEvent(MqttEvent.UNSUBSCRIBED, {
      ...baseParams,
      [MqttEventParam.TOPIC]: sub.topic,
    });
  });

  it('calls message received callback', (done) => {
    const msg = { topic: 'test/topic/#', payload: Uint8Array.from(Buffer.from("Test", "utf-8")) };
    mqttClient.on(MqttEvent.MESSAGE_RECEIVED, (topic: string, payload: Uint8Array) => {
      expect(topic).toBe(msg.topic);
      expect(payload).toStrictEqual(msg.payload);
      done();
    });
    mockEmitter.triggerEvent(MqttEvent.MESSAGE_RECEIVED, {
      ...baseParams,
      [MqttEventParam.TOPIC]: msg.topic,
      [MqttEventParam.PAYLOAD]: "VGVzdA=="
    });
  });

  it('calls message published callback', (done) => {
    const msg = { topic: 'test/topic/#', payload: Uint8Array.from(Buffer.from("Test", "utf-8")) };
    mqttClient.on(MqttEvent.MESSAGE_PUBLISHED, (topic: string, payload: Uint8Array) => {
      expect(topic).toBe(msg.topic);
      expect(payload).toStrictEqual(msg.payload);
      done();
    });
    mockEmitter.triggerEvent(MqttEvent.MESSAGE_PUBLISHED, {
      ...baseParams,
      [MqttEventParam.TOPIC]: msg.topic,
      [MqttEventParam.PAYLOAD]: "VGVzdA=="
    });
  });

  it('calls disconnected callback', (done) => {
    mqttClient.on(MqttEvent.DISCONNECTED, done);
    mockEmitter.triggerEvent(MqttEvent.DISCONNECTED, baseParams);
  });

  it('calls closed callback', (done) => {
    mqttClient.on(MqttEvent.CLOSED, done);
    mockEmitter.triggerEvent(MqttEvent.CLOSED, baseParams);
  });

  it('calls exception callback', (done) => {
    const reason = {
      [MqttEventParam.ERR_MESSAGE]: 'Error Message',
      [MqttEventParam.ERR_CODE]: 99,
      [MqttEventParam.STACKTRACE]: 'Stack\tTrace',
    };
    mqttClient.on(
      MqttEvent.EXCEPTION,
      (errMsg?: string, errCode?: number, stackTrace?: string) => {
        expect(errMsg).toBe(reason[MqttEventParam.ERR_MESSAGE]);
        expect(errCode).toBe(reason[MqttEventParam.ERR_CODE]);
        expect(stackTrace).toBe(reason[MqttEventParam.STACKTRACE]);
        done();
      }
    );
    mockEmitter.triggerEvent(MqttEvent.EXCEPTION, {
      ...baseParams,
      ...reason,
    });
  });
});
