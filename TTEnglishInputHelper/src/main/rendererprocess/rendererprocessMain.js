'use strict';

import * as renderercomm from '../electron/renderercomm.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/path.js';

const commClient = new renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = new msgcomm.MsgCommClient(commClient, [pathutils.Path]);

document.addEventListener('DOMContentLoaded', ()=>{
  document.body.appendChild(document.createElement('p').appendChild(document.createTextNode('hello, world')));
  rdrMsgComm.fetchClass().then(()=>{
    document.body.appendChild(document.createElement('p').appendChild(document.createTextNode('hello, world2')));
  });
});
