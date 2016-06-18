'use strict';

import * as renderercomm from '../electron/renderercomm.js';
import * as msgcommm from '../common/MsgComm.js';
import * as pathutils from '../common/path.js';

const commClient = renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = msgcomm.MsgCommClient(commClient, [pathutils.Path]);

document.addEventListener('DOMContentLoaded', ()=>{
  document.body.appendChild(document.createElement('p').appendChild(document.createTextNode('hello, world')));
  rdrMsgComm.fetch().then(()=>{
    document.body.appendChild(document.createElement('p').appendChild(document.createTextNode('hello, world2')));
  });
});
