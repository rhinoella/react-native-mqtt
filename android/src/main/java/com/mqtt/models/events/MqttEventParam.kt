package com.mqtt.models.events

enum class MqttEventParam {
  SERVER_URI,
  CLIENT_REF,
  ERR_MESSAGE,
  ERR_CODE,
  STACKTRACE,
  TOPIC,
  PAYLOAD,
  QOS,
  RETAIN
}
