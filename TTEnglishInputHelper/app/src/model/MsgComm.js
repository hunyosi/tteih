const ipc = require('ipc');




class IpcMsgComm {
  IpcMsgComm() {
  }

  send(msg, params) {
    const obj = {
      msg: msg,
      params: null
    };
    obj.params = wrapObj(params);
    ipc.send('IpcMsgComm.sendMsg', JSON.stringify(obj));
  }
}


class MsgComm {
  MsgComm() {
  }

  send(msg, params) {
  }
}


module.exports = MsgComm;
