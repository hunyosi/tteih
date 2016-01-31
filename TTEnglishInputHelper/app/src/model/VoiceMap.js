const tt = require('tt.js');
const progressObj = require('Progress.js');


function stripNumber(src) {
  var dst = [];
  var i1, z1 = src.length;
  for (i1 = 0; i1 < z1; ++i1) {
    dst[i1] = src[i1].replace(/^([A-Za-z]+)\d*$/, "$1");
  }
  return dst;
}


function VoiceMapRule(
  lookbehind, patternBody, lookahead, voElmsToRepl) {

  if (!lookbehind || !(lookbehind instanceof Array)) {
    lookbehind = [];
  }
  if (!patternBody || !(patternBody instanceof Array)) {
    patternBody = [];
  }
  if (!lookahead || !(lookahead instanceof Array)) {
    lookahead = [];
  }
  if (!voElmsToRepl || !(voElmsToRepl instanceof Array)) {
    voElmsToRepl = [];
  }

  this.lookbehind = lookbehind;
  this.patternBody = patternBody;
  this.lookahead = lookahead;
  this.voElmsToRepl = voElmsToRepl;
}

VoiceMapRule.prototype.toString = function() {
  return this.lookbehind.join(" ") +
    "/" + this.patternBody.join(" ") + "/" +
    this.lookahead.join(" ") +
    +"//" + this.voElmsToRepl.join(" ");
};


function VoiceMap() {
  this.rules = {};
  this.warns = [];
}

VoiceMap.prototype.rules = null;
VoiceMap.prototype.warns = null;

VoiceMap.prototype.add = function(
  lookbehind, patternBody, lookahead, voElmsToRepl) {
  var key = "";
  var rule = new VoiceMapRule(lookbehind, patternBody, lookahead, voElmsToRepl);

  if (rule.voElmsToRepl.length < 1) {
    return;
  }

  if (0 < rule.patternBody.length) {
    key = rule.patternBody[0];
  } else {
    key = "";
  }

  if (!(key in this.rules)) {
    this.rules[key] = [];
  }

  this.rules[key].push(rule);
};

VoiceMap.parse = function(str, srcElmSet, dstElmSet) {
  var obj = new VoiceMap();
  var warns = [];
  var lines, line, i1, z1;
  var flds, prons, pron, ptnw, ptn0, ptn1, ptn, i2, z2, i3, z3;
  var pronObj, pairs, pair;

  lines = str.split(/\u000D\u000A|\u000A|\u000D/);
  z1 = lines.length;
  for (i1 = 0; i1 < z1; ++i1) {
    line = lines[i1].trim();
    if (line.length < 1 || /^\s*#/.test(line)) {
      continue;
    }

    flds = line.split(/\t/);
    if (flds.length < 2) {
      warns.push("WARNNING: line " + (i1 + 1) +
        ": Number of separators is illegal.");
      continue;
    }

    ptn0 = flds.shift().split(/\//);
    if (ptn0.length !== 3) {
      warns.push("WARNNING: line " + (i1 + 1) +
        ": Number of slashes in pattern is illegal.");
      continue;
    }

    ptn = [];
    for (i2 = 0; i2 < 3; ++i2) {
      ptnw = ptn0[i2].trim();
      if (ptnw.length < 1) {
        ptn1 = [];
      } else {
        ptn1 = ptnw.split(/\s+/);
        for (i3 = 0, z3 = ptn1.length; i3 < z3; ++i3) {
          if (srcElmSet && !(ptn1[i3] in srcElmSet)) {
            warns.push("WARNNING: line " + (i1 + 1) +
              ": A pattern element '" + ptn1[i3] + "' is nothing in source element set.");
          }
        }
      }
      ptn.push(ptn1);
    }

    prons = [];
    for (i2 = 0, z2 = flds.length; i2 < z2; ++i2) {
      pron = flds[i2].trim();
      pronObj = {
        voName: pron
      };

      ++i2;
      if (i2 < z2) {
        pairs = flds[i2].split('/');
        for (i3 = 0, z3 = pairs; i3 < z3; ++i3) {
          pair = pairs[i3].split('=', 2);
          if (pair.length === 1 && 0 < pair[0].length) {
            pronObj[pair[0]] = true;
          } else if (pair.length === 2) {
            pronObj[pair[0]] = pair[1];
          }
        }
      }

      if (0 < pron.length) {
        prons.push(pronObj);
      }
    }

    z2 = prons.length;
    if (z2 < 1) {
      warns.push("WARNNING: line " + (i1 + 1) +
        ": replacing pronunation element is empty.");
      continue;
    }
    if (dstElmSet) {
      for (i2 = 0; i2 < z2; ++i2) {
        if (!(prons[i2] in dstElmSet)) {
          warns.push("WARNNING: line " + (i1 + 1) +
            ": A replacing pronunation element '" + prons[i2] + "' is nothing in target element set.");
        }
      }
    }

    obj.add(ptn[0], ptn[1], ptn[2], prons);
  }

  obj.warns = warns;

  return obj;
}


VoiceMap.prototype.pronunationsToVoiceNames = function(src) {
  tt.pp('VoiceMap.prototype.pronunationsToVoiceNames');

  if (!(src instanceof Array)) {
    return null;
  }

  var self = this;
  var dst = [];
  var srcLen = src.length,
    pos = 0;

  function translateImpl() {
    var p2, p3;
    var subset;
    var loop, loopEnd;
    var matched;

    if (!(pos < srcLen)) {
      return true;
    }

    //   if (pos < srcLen) {
    subset = self.rules[src[pos].val];
    loopEnd = 2;
    //   } else {
    //    subset = self.rules[""];
    //    loopEnd = 1;
    //   }

    matched = false;
    for (loop = 0; !matched && loop < loopEnd; ++loop) {
      if (subset) {
        var i1, z1;
        z1 = subset.length;
        for (i1 = 0; !matched && i1 < z1; ++i1) {
          var rule = subset[i1];
          var lb = rule.lookbehind;
          var pb = rule.patternBody;
          var la = rule.lookahead;
          var ve = rule.voElmsToRepl;
          var i2, z2;

          i2 = 0;
          z2 = lb.length;
          p2 = pos - z2;
          if (lb[0] === "^") {
            if (p2 !== -1) {
              continue;
            }
            i2 = 1;
            p2 = 0;
          }
          if (p2 < 0) {
            continue;
          }
          for (; p2 < srcLen && i2 < z2; ++i2, ++p2) {
            if (lb[i2] !== src[p2].val) {
              break;
            }
          }
          if (i2 < z2) {
            continue;
          }

          p2 = pos;
          z2 = pb.length;
          if (srcLen <= p2 + z2 - 1) {
            continue;
          }
          for (i2 = 0; p2 < srcLen && i2 < z2; ++i2, ++p2) {
            if (pb[i2] !== src[p2].val) {
              break;
            }
          }
          if (i2 < z2) {
            continue;
          }

          p3 = p2;
          z2 = la.length;
          if (la[z2 - 1] === "$") {
            --z2;
            if (p2 + z2 !== srcLen) {
              continue;
            }
          }
          if (srcLen <= p2 + z2 - 1) {
            continue;
          }
          for (i2 = 0; p2 < srcLen && i2 < z2; ++i2, ++p2) {
            if (la[i2] !== src[p2].val) {
              break;
            }
          }
          if (i2 < z2) {
            continue;
          }

          tt.pp('pos=', pos, ', srcLen=', srcLen, ', src.val=', src[pos].val, 'rule=' + rule);

          var i3, z3, srcAry = [];
          for (i3 = pos, z3 = p3; i3 < z3; ++i3) {
            srcAry.push(src[i3]);
          }
          for (i3 = 0, z3 = ve.length; i3 < z3; ++i3) {
            dst.push({
              val: ve[i3],
              src: srcAry,
              err: false
            });
          }
          pos = p3;
          matched = true;
        }
      }
      subset = self.rules[""];
    }

    //   if (loopEnd == 1) {
    //    break;
    //   }

    if (!matched) {
      dst.push({
        val: "(" + src[pos].val + ")",
        src: [src[pos]],
        err: true
      });
      ++pos;
    }

    return false;
  }

  return new Promise(function(resolve, reject) {
    function translateLoop() {
      var resolved;

      try {

        if (progressObj.cancelFlag) {
          reject(null);
          return;
        }

        resolved = translateImpl();

        if (pos < src.length) {
          progressObj.setCur(src[pos].src.no);
        }

        if (resolved) {
          tt.pp("resolve: dst=", dst);
          resolve(dst);
        } else {
          setTimeout(translateLoop, 0);
        }

      } catch (ex) {
        reject(ex);
      }
    }

    setTimeout(translateLoop, 0);
  });
};




function transFromText(ust, txt, dict, voMap) {
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
