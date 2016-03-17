import tt from './tt.js';

export function parseCMUdict(str) {
  tt.pp("parseCMUdict");
  var dict = {};
  var lines = str.split(/\u000D\u000A|\u000A|\u000D/);
  var line, pair;
  var i1, z1;
  var word, wordBody, pronun, m, pObj, pObj2, anotherPronunciations;

  //  tt.printLn(lines[0]);
  z1 = lines.length;
  for (i1 = 0; i1 < z1; ++i1) {
    line = lines[i1];
    if (/^;;;/.test(line)) {
      continue;
    }
    if (/^\s*$/.test(line)) {
      continue;
    }

    pair = line.split(/  /);
    word = pair[0];
    pronun = pair[1];

    if (m = /^([A-Z']+)\(\d+\)$/.exec(word)) {
      wordBody = m[1];
      if (!(wordBody in dict)) {
        dict[wordBody] = pronun;
      }

      pObj = dict[wordBody];
      if (typeof(pObj) === "string") {
        anotherPronunciations = [{
          word: wordBody,
          pronun: pObj
        }];
        dict[wordBody] = {
          pronun: pObj,
          another: anotherPronunciations
        };
      } else {
        anotherPronunciations = pObj.another;
      }

      anotherPronunciations.push({
        word: word,
        pronun: pronun
      });

      dict[word] = {
        pronun: pronun,
        another: anotherPronunciations
      };

    } else {
      dict[word] = pronun;
    }
  }
  return dict;
}
