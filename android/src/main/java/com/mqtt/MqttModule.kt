package com.mqtt

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mqtt.models.MqttOptions
import com.mqtt.models.MqttSubscription
import com.mqtt.models.PublishOptions
import com.mqtt.models.QoS
import com.mqtt.models.events.MqttEvent
import com.mqtt.utils.createClientReference
import kotlin.collections.HashMap

class MqttModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val clients = HashMap<String, Mqtt>()

  override fun getName(): String {
    return "Mqtt"
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    // Upstream listeners
    Log.d("Mqtt", "added Listener: $eventName")
  }

  @ReactMethod
  fun removeListeners(count: Int?) {
    // Remove upstream listeners
    Log.d("Mqtt", "removed $count listeners")
  }

  @ReactMethod
  fun createClient(options: ReadableMap, promise: Promise) {
    val clientRef = createClientReference()
    try {
      val client = Mqtt(clientRef, reactContext, MqttOptions(options))
      clients[clientRef] = client
      promise.resolve(clientRef)
    } catch (e: Throwable) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun connect(clientRef: String, promise: Promise? = null) {
    withAssertedClient(clientRef) { it.connect(promise) }
  }

  @Suppress("UNCHECKED_CAST")
  @ReactMethod
  fun subscribe(topics: ReadableArray, clientRef: String, promise: Promise? = null) {
    val mqttSubscriptions = topics.toArrayList().map {
      it as HashMap<String, Any>
      MqttSubscription(it["topic"]!! as String, QoS.values()[(it["qos"] as Number?)?.toInt() ?: 0])
    }.toTypedArray()
    withAssertedClient(clientRef) { it.subscribe(*mqttSubscriptions, promise = promise) }
  }

  @Suppress("UNCHECKED_CAST")
  @ReactMethod
  fun unsubscribe(topics: ReadableArray, clientRef: String, promise: Promise? = null) {
    val toUnsubscribeFrom = (topics.toArrayList() as List<String>).toTypedArray()
    withAssertedClient(clientRef) { it.unsubscribe(toUnsubscribeFrom, promise = promise) }
  }

  @ReactMethod
  fun publish(
    topic: String,
    payloadBase64: String,
    options: ReadableMap,
    clientRef: String,
    promise: Promise? = null
  ) {
    withAssertedClient(clientRef) {
      it.publish(
        topic,
        payloadBase64,
        PublishOptions(options),
        promise = promise
      )
    }
  }

  @ReactMethod
  fun disconnect(clientRef: String, promise: Promise? = null) {
    withAssertedClient(clientRef) { it.disconnect(promise) }
  }

  @ReactMethod
  fun close(clientRef: String, force: Boolean = false, promise: Promise? = null) {
    withAssertedClient(clientRef) { it.end(force, promise) }
  }

  @ReactMethod
  fun end(clientRef: String, force: Boolean = false, promise: Promise? = null) {
    withAssertedClient(clientRef) { it.end(force, promise) }
  }

  @ReactMethod
  fun isConnected(clientRef: String, promise: Promise) {
    promise.resolve(withAssertedClient(clientRef) { it.isConnected() } ?: false)
  }

  @ReactMethod
  fun reconnect(clientRef: String) {
    withAssertedClient(clientRef) { it.reconnect() }
  }

  private fun <R> withAssertedClient(clientRef: String, functor: (Mqtt) -> R): R? {
    return if (clients[clientRef] != null) {
      clients[clientRef]!!.let(functor)
    } else {
      val params = Arguments.createMap()
      params.putString("clientRef", clientRef)
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(MqttEvent.CLIENT_REF_UNKNOWN.name, params)
      null
    }
  }
}
