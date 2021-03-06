'use strict';


export function bufferToArrayBuffer(buffer) {
  const len = buffer.length;
  const aryBuf = new ArrayBuffer(len);
  const u8ary = new Uint8Array(aryBuf);
  let idx;
  for (idx = 0; idx < len; ++ idx) {
    u8ary[idx] = buffer[idx];
  }
  return aryBuf;
}


export function arrayBufferToBuffer(aryBuffer) {
  const aryBuf = aryBuffer instanceof ArrayBuffer ? aryBuffer : aryBuffer.buffer;
  const u8ary = new Uint8Array(aryBuf);
  return new Buffer(u8ary);
}
