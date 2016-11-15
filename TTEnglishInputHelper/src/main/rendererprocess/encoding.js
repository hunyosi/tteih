'use strict';

export function decode(binary, encoding) {
  return new Promise((resolve, reject)=>{
    try {
      const charset = encoding ? ';charset=' + encoding : '';
      const blob = new Blob([binary], {type: 'text/plain' + charset});
      const url = URL.createObjectURL(blob);
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'text';
      xhr.onreadystatechange = ()=>{
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
    } catch (e) {
      reject(e);
    }
  });
}
