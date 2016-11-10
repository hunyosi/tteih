import * as tt from './tt.js';
import {Progress} from './Progress.js';
const progressObj = Progress.getInstance();

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


export function VoiceMap() {
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
