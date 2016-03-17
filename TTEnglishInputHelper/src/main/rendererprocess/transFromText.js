import * as ConvUnknownWord from './ConvUnknownWord.js';
import tt from './tt.js';
import Progress from './Progress.js';
const progressObj = Progress.getInstanse();


export function transFromText(ust, txt, dict, voMap) {
  tt.pp("transFromText");

  var push = Array.prototype.push;

  var words = [],
    fromUst = [],
    fromTxt = [];

  if (ust && convNote && insertTextMode !== 3) {
    fromUst = getWordsFromUst(ust);
  }

  if (insertTextMode !== 0) {
    fromTxt = parseText(txt);
  }

  switch (insertTextMode) {
    case 0:
      words = fromUst;
      break;
    case 1:
      push.apply(words, fromTxt);
      push.apply(words, fromUst);
      break;
    case 2:
      push.apply(words, fromUst);
      push.apply(words, fromTxt);
      break;
    case 3:
      words = fromTxt;
      break;
  }

  var i, z;
  for (i = 0, z = words.length; i < z; ++i) {
    words[i].no = i + 1;
  }

  return wordsToVoiceNames(words, dict, voMap);
}


function parseText(txt) {
  var i1, z1;
  var words = [];
  var rawWords = txt.split(/[^0-9A-Za-z'\(\)]+/);
  var wordObj;

  for (i1 = 0, z1 = rawWords.length; i1 < z1; ++i1) {
    wordObj = {
      val: rawWords[i1],
      idx: "text." + i1
    };
    words.push(wordObj);
  }

  return words;
}


function getWordsFromUst(ust) {
  var words = [];

  ust.each(function(elm) {
    var word, wordObj;
    word = elm.items["Lyric"];
    if (word === "R") {
      word = "(" + word + ")";
    }

    wordObj = {
      val: word,
      idx: "ust." + elm.name,
      src: elm
    };
    words.push(wordObj);
  });

  return words;
}


function stripNumber(src) {
  var dst = [];
  var i1, z1 = src.length;
  for (i1 = 0; i1 < z1; ++i1) {
    dst[i1] = src[i1].replace(/^([A-Za-z]+)\d*$/, "$1");
  }
  return dst;
}


function wordsToVoiceNames(words, dict, voMap) {
  var push = Array.prototype.push;
  var arpabetAry = [];
  var p = [];
  var i1, z1;
  var unknown;

  tt.pp("wordsToVoiceNames");

  progressObj.init(0, words.length, 0);

  z1 = words.length;
  i1 = 0;

  function transFromTextImpl() {
    var word;
    var srcObj;
    var arpabetStr;
    var arpabetTmpAry;
    var i2, z2;
    var m;

    for (; i1 < z1; ++i1) {
      srcObj = words[i1];
      word = srcObj.val.trim();
      if (word && 0 < word.length) {
        if (m = /^\((.*)\)$/.exec(word)) {
          unknown = {
            val: {
              voName: m[1].trim()
            },
            src: [{
              val: "(through)",
              src: srcObj,
              err: false
            }],
            err: false
          };
          ++i1;
          return false;
        } else {
          arpabetTmpAry = null;

          arpabetStr = dict[word.toUpperCase()];
          tt.pp(i1 + ": word=" + word + ", arpabetStr=" + arpabetStr);
          if (arpabetStr) {
            if (arpabetStr.another) {
              srcObj.anotherPronunciations = arpabetStr.another;
              arpabetStr = arpabetStr.pronun;
            }

            arpabetTmpAry = stripNumber(arpabetStr.split(/ /));
          } else {
            arpabetTmpAry = ConvUnknownWord.convUnknownEnglishWord(word);
            tt.pp(i1 + ": word=" + word + ", arpabetTmpAry=[" + arpabetTmpAry + "]");
          }

          if (arpabetTmpAry) {
            for (i2 = 0, z2 = arpabetTmpAry.length; i2 < z2; ++i2) {
              arpabetAry.push({
                val: arpabetTmpAry[i2],
                src: srcObj,
                err: false
              });
            }

          } else {
            unknown = {
              val: {
                voName: "#" + word + "#"
              },
              src: [{
                val: "(unknown)",
                src: srcObj,
                err: true
              }],
              err: true
            };
            ++i1;
            return false;
          }
        }
      }
    }

    return true;
  }

  return new Promise(function(resolve, reject) {
    function transFromTextLoop() {
      try {
        if (progressObj.cancelFlag) {
          reject(null);
          return;
        }

        if (transFromTextImpl()) {
          voMap.pronunationsToVoiceNames(arpabetAry).then(function(translated) {
              push.apply(p, translated);
              arpabetAry = [];
              resolve(p);
            },
            function(ex) {
              reject(ex);
            });

        } else {
          voMap.pronunationsToVoiceNames(arpabetAry).then(function(translated) {
              tt.pp("p=", p, ", translated=", translated);
              try {
                push.apply(p, translated);
                p.push(unknown);
                arpabetAry = [];
                tt.pp("p=", p);
                setTimeout(transFromTextLoop, 0);
              } catch (ex) {
                reject(ex);
              }
            },
            function(ex) {
              reject(ex);
            });
        }
      } catch (ex) {
        reject(ex);
      }
    }

    setTimeout(transFromTextLoop, 0);
  });
}
