'use strict';

import * as renderercomm from '../electron/renderercomm.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/pathUtils.js';

const commClient = new renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = new msgcomm.MsgCommClient(commClient, [pathutils.Path, pathutils.RouteElement]);

document.addEventListener('DOMContentLoaded', ()=>{
  let fs;
  let appEnv;
  putp('hello, world');
  rdrMsgComm.fetchClass().then(()=>{
    putp('hello, world 2');
    return rdrMsgComm.getInstance('FileSystem');
  }).then((instance)=>{
    putp('hello, world 3: ' + instance);
    fs = instance;
    return rdrMsgComm.getInstance('AppEnv');
  }).then((instance)=>{
    putp('hello, world 3: ' + instance);
    appEnv = instance;
    return appEnv.getPath('app');
  }).then((appPath)=>{
    putp('appPath: ' + pathutils.buildUnixPath(appPath));
    return fs.readFile(appPath.add('package.json'));
  }).then((data)=>{
    return new Promise((resolve, reject)=>{
      putp('read: ' + data);
      const blob = new Blob([data], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      putp('blob url: ' + url);
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'text';
      xhr.onreadystatechange = ()=>{
        putp('xhr state: ' + xhr.readyState);
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const res = xhr.response;
            resolve(res);
          } else {
            reject({status: xhr.status, statusText: xhr.stausText});
          }
        }
      };
      xhr.open('GET', url, true);
      xhr.send();
    });
  }).then((data)=>{
    putp('date: ' + data);
  }).catch((err)=>{
    putp('error: ' + err);
  });
});

function putp(str) {
  const textNode = document.createTextNode(str);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
}
