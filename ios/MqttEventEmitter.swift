import Foundation

class MqttEventEmitter {
  private let nativeEventEmitter: RCTEventEmitter
  private let clientRef: String

  init(withNativeEventEmitter eventEmitter: RCTEventEmitter, clientRef: String) {
    self.nativeEventEmitter = eventEmitter
      self.clientRef = clientRef
  }

  func forwardException(e: Error) {
    let params: [String: Any] = [
        MqttEventParam.ERR_CODE.rawValue: 0,
      MqttEventParam.ERR_MESSAGE.rawValue: e.localizedDescription,
      MqttEventParam.STACKTRACE.rawValue: ""
    ]
      self.nativeEventEmitter.sendEvent(withName: MqttEvent.EXCEPTION.rawValue, body: params)
  }

  func sendEvent(event: MqttEvent, params: NSMutableDictionary = [:]) {
      params.setValue(self.clientRef, forKey: MqttEventParam.CLIENT_REF.rawValue)
      self.nativeEventEmitter.sendEvent(withName: event.rawValue, body: params)
  }
}
