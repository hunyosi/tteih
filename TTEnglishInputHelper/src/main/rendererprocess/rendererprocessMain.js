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
  putp('hello, world');
  rdrMsgComm.fetchClass().then(()=>{
    putp('hello, world 2');
    return rdrMsgComm.getInstance('FileSystem');
  }).then((instance)=>{
    putp('hello, world 3: ' + instance);
    fs = instance;
    return rdrMsgComm.getInstance('AppEnv');
  }).then((instance)=>{
    putp('hello, world 4: ' + instance);
    appEnv = instance;
    return encoding.initCodePointMap();
  }).then((data)=>{
    putp('hello, world 5: data.length=' + data.length);
    const numOfRows = 94;
    const numOfCells = 94;
    const curRow = 2;
    let chrCode = 0, prevChr = 0;
    let chrIdx = 0;
    for (let rowIdx = 0; rowIdx < numOfRows; ++rowIdx) {
      let rowBuf = '';
      for (let cellIdx = 0; cellIdx < numOfCells; prevChr = chrCode, ++chrIdx) {
        chrCode = data.charCodeAt(chrIdx);
        if (prevChr === 0xFFFD && chrCode < 0x80) {
          continue;
        }
        rowBuf += data.charAt(chrIdx);
        ++cellIdx;
      }
      console.log("row[" + (rowIdx + 1) + "]=" + rowBuf);
    }
  }).then(()=>{
    const fileUtils = new FileUtils(fs, appEnv);
    const tteih = new TTEnglishInputHelper(appEnv, fs, fileUtils);
    return tteih.init();
  }).then((data)=>{
    putp('ready');
    putp(data);
  }).catch((err)=>{
    putp('error: ');
    putp(err);
  });
});

function putp(str) {
  if (str instanceof Error) {
    if (str.stack) {
      console.log(str.stack);
    } else {
      console.error(str);
    }
  } else {
    console.log(str);
  }
/*
  const textNode = document.createTextNode(str);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
*/
}
