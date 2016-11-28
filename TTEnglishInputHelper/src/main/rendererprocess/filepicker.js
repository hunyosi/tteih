'use strict';

import * as encoding from './encoding.js';

export class FilePicker {
  constructor(doc) {
    this._doc = doc;

    const anchor = doc.createElement('a');
    anchor.style.display = 'none';
    doc.body.appendChild(anchor);
    this._anchor = anchor;
  }

  saveTextFile(fileName, charset, str) {
    return encoding.encode(str, charset)
      .then((data)=>{
        return this.saveBinaryFile(fileName, data);
      });
  }

  saveBinaryFile(fileName, aryBuf) {
    const doc = this._doc;
    const blob = new Blob([aryBuf], {type: 'application/octet-binary'});
    const url = URL.createObjectURL(blob);

    const anchor = this._anchor;
    anchor.style.display = 'none';
    anchor.setAttribute('download', fileName);
    anchor.setAttribute('href', url);

    const event = doc.createEvent('MouseEvents');
    event.initEvent('click', false, false);
    anchor.dispatchEvent(event);
  }
}
