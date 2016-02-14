const ipc = require('ipc');


function wrapObj(obj) {
  
}


class IpcMsgComm {
  IpcMsgComm() {
  }

  send(msg, params) {
    const obj = {
      msg: msg,
      params: []
    };
    for (params) {

    }
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
