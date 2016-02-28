const serialize = require('../common/serialize.js')
const ipc = require('ipc');




class IpcMsgComm {
  IpcMsgComm() {
  }

  send(data) {
    ipc.send('IpcMsgComm.sendMsg', data);
  }
}


class MsgComm {
  MsgComm() {
  }

  send(msg, params) {
    const obj = {
      id:
      msg: msg,
      params: serialize.toJSONObject(params);
    };
    String str = JSON.stringify(obj);

  }
}


module.exports = MsgComm;
