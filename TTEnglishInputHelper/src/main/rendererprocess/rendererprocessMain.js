'use strict';

import * as renderercomm from '../electron/renderercomm.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/path.js';

const commClient = new renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = new msgcomm.MsgCommClient(commClient, [pathutils.Path]);

document.addEventListener('DOMContentLoaded', ()=>{
  putp("hello, world");
  rdrMsgComm.fetchClass().then(()=>{
    putp("hello, world 2");
  });
});

function putp(str) {
  const textNode = document.createTextNode(str);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
}
