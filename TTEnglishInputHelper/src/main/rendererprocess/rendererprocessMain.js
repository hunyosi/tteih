'use strict';
import * as utils from '../common/utils.js';
import * as renderercomm from '../electron/renderercomm.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/pathUtils.js';
import * as encoding from './encoding.js';
import {FileUtils} from './fileutils.js';
import {TTEnglishInputHelper} from './rendererprocess.js';

const commClient = new renderercomm.RendererCommunicatorClient('msgcomm');
const rdrMsgComm = new msgcomm.MsgCommClient(commClient, [pathutils.Path, pathutils.RouteElement]);

document.addEventListener('DOMContentLoaded', ()=>{
  let fs;
  let appEnv;
  let defaultPath;
  putp('initialize process: 01:');
  rdrMsgComm.fetchClass().then(()=>{
    putp('initialize process: 02:');
    return rdrMsgComm.getInstance('FileSystem');
  }).then((instance)=>{
    putp('initialize process: 03: ' + instance);
    fs = instance;
    return rdrMsgComm.getInstance('AppEnv');
  }).then((instance)=>{
    putp('initialize process: 04: ' + instance);
    appEnv = instance;
    return 'test';
  }).then((result)=>{
    putp('initialize process: 05: result=' + result);
    const fileUtils = new FileUtils(fs, appEnv);
    const tteih = new TTEnglishInputHelper(appEnv, fs, fileUtils);
    return tteih.init();
  }).then((data)=>{
    putp('initialize process: ready:');
    putp(data);
  }).catch((err)=>{
    putp('initialize process: failure:');
    putp(err);
  });
});

function putp(...msgs) {
  for (let msg of msgs) {
    if (msg instanceof Error) {
      if (msg.stack) {
        console.log(msg.stack);
      } else {
        console.error(msg);
      }
    } else {
      console.log(msg);
    }

    // const textNode = document.createTextNode(msg);
    // const p = document.createElement('p');
    // p.appendChild(textNode);
    // document.body.appendChild(p);
  }
}
