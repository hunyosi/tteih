'use strict';

import * as renderercomm from '../electron/renderercomm.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/path.js';

const commClient = new renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = new msgcomm.MsgCommClient(commClient, [pathutils.Path, pathutils.RouteElement]);

document.addEventListener('DOMContentLoaded', ()=>{
  let fs;
  putp("hello, world");
  rdrMsgComm.fetchClass().then(()=>{
    putp("hello, world 2");
    return rdrMsgComm.getInstance('FileSystem');
  }).then((instance)=>{
    putp("hello, world 3: " + instance);
    fs = instance;
    return fs.getCurPath();
  }).then((curPath)=>{
    putp("curPath: " + pathutils.buildUnixPath(curPath));
  }).catch((err)=>{
    putp("error: " + err);
  });
});

function putp(str) {
  const textNode = document.createTextNode(str);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
}
