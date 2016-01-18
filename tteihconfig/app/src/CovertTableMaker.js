/*
# [COPYING]
#     TTEIHConfig
#     Copyright (C) 2016 Hunyosi Asakura
#
#     This Source Code Form is subject to the terms of
#     the Mozilla Public License, v. 2.0.
#     If a copy of the MPL was not distributed with this file,
#     You can obtain one at http://mozilla.org/MPL/2.0/.
# [/COPYING]
*/

module.exports = (function() {
  "use strict";

  function parseVoiceNames(data) {
    var lines, line;
    var i1, z1;
    var names, name;
    var pair, vals;

    names = [];
    lines = data.split(/\u000D\u000A|\u000A|\u000D/);
    for (i1 = 0, z1 = lines.length; i1 < z1; ++i1) {
      line = lines[i1];
      pair = line.split("=", 2);
      if (pair.length !== 2) {
        continue;
      }

      vals = pair[1].split(",");
      name = vals[0];
      if (name.length < 1) {
        name = pair[0].replace(/\.[^\.]*$/, '');
      }

      names.push(name);
    }

    return names;
  }


  function parseMapping(data) {
    var lines, line;
    var i1, z1;
    var vals, key, keyTop, weight;
    var mappingInfo = {
      headPattern: null,
      tailPattern: null,
      splitPattern: null,
      replacePatterns: [],
      maps: {},
      bypass: []
    };
    var maps = mappingInfo.maps;

    lines = data.split(/\u000D\u000A|\u000A|\u000D/);
    for (i1 = 0, z1 = lines.length; i1 < z1; ++i1) {
      line = lines[i1];
      vals = line.split("\t");
      if (vals.length < 2) {
        continue;
      }

      if (vals[0].length < 1) {
        const comment = vals[2];
        if (comment === "*bypass*") {
          const obj = ConvTblElm.createInstanceByArray(vals.slice(3), vals[1] + 0);
          if (obj) {
            mappingInfo.bypass.push(obj);
          }
        }
        continue;

      } else if (vals[1] + 0 < 0) {
        const comment = vals[2];
        if (comment === "*head*") {
          mappingInfo.headPattern = new RegExp(vals[0]);
          continue;
        } else if (comment === "*tail*") {
          mappingInfo.tailPattern = new RegExp(vals[0]);
          continue;
        } else if (comment === "*split*") {
          mappingInfo.splitPattern = new RegExp(vals[0]);
          continue;
        } else if (comment === "*replace*") {
          const rp = {pattern: new RegExp(vals[0], "g"), value:""};
          if (vals[3]) {
            rp.value = vals[3];
          }
          mappingInfo.replacePatterns.push(rp);
          continue;
        }
      }

      key = vals.shift();
      keyTop = key.charAt(0);
      if (!(keyTop in maps)) {
        maps[keyTop] = [];
      }

      weight = vals.shift();

      maps[keyTop].push({
        lineNo: (i1 + 1),
        key: key,
        weight: weight + 0,
        vals: vals
      });
    }

    for (key in maps) {
      maps[key].sort(function(a, b) {
        var diff = b.key.length - a.key.length;
        if (diff !== 0) {
          return diff;
        }
        return a.lineNo - b.lineNo;
      });
    }

    return mappingInfo;
  }


  function ConvTblElm(voiceName, type, pronunciation, weight) {
    this.voiceName = voiceName;

    this.index = ConvTblElm._nextIndex;
    ++ConvTblElm._nextIndex;

    if (type) {
      this.type = type;
    }

    if (pronunciation) {
      this.pronunciation = pronunciation;
    }

    if (weight) {
      this.weight = weight;
    }
  }

  ConvTblElm.TYPE_IGNORE = 0;
  ConvTblElm.TYPE_INDEPENDENT = 1;
  ConvTblElm.TYPE_FIRST = 2;
  ConvTblElm.TYPE_LAST = 3;
  ConvTblElm.TYPE_MIDDLE = 4;
  ConvTblElm.TYPE_LAST_HARD = 5;
  ConvTblElm.TYPE_MIDDLE_HARD = 6;

  ConvTblElm._nextIndex = 0;

  ConvTblElm.createInstanceByArray = function(srcAry, weight) {
    if (srcAry.length < 1) {
      return null;
    }

    const convTblElmStr = srcAry.join("\t");

    if (convTblElmStr.charAt(0) === "#") {
      const comment = convTblElmStr.substring(1).trim();
      const obj = new ConvTblElm(comment, ConvTblElm.TYPE_IGNORE, null, weight);
      obj.convTblElmStr = convTblElmStr;
      return obj;
    }

    if (srcAry.length < 2) {
      return null;
    }

    const patternParts = srcAry[0].split(/\//);
    if (patternParts.length !== 3) {
      return null;
    }

    let type = ConvTblElm.TYPE_IGNORE;
    let pronunciation = null;
    const firstPtnPart = patternParts[0].trim();
    const middlePtnPart = patternParts[1].trim();
    const lastPtnPart = patternParts[2].trim();
    if (firstPtnPart === "^" && lastPtnPart === "$") {
      type = ConvTblElm.TYPE_INDEPENDENT;
      pronunciation = middlePtnPart.split(/\s+/);
    } else if (firstPtnPart === "^") {
      type = ConvTblElm.TYPE_FIRST;
      pronunciation = middlePtnPart.split(/\s+/);
      pronunciation = pronunciation.concat(lastPtnPart.split(/\s+/));
    } else if (lastPtnPart === "$") {
      if (0 < firstPtnPart.length) {
        type = ConvTblElm.TYPE_LAST;
        pronunciation = firstPtnPart.split(/\s+/);
        pronunciation = pronunciation.concat(middlePtnPart.split(/\s+/));
      } else {
        type = ConvTblElm.TYPE_LAST_HARD;
        pronunciation = middlePtnPart.split(/\s+/);
      }
    } else {
      if (0 < firstPtnPart.length) {
        type = ConvTblElm.TYPE_MIDDLE;
        pronunciation = firstPtnPart.split(/\s+/);
        pronunciation = pronunciation.concat(middlePtnPart.split(/\s+/));
        if (0 < lastPtnPart.length) {
          pronunciation = pronunciation.concat(lastPtnPart.split(/\s+/));
        }
      } else {
        type = ConvTblElm.TYPE_MIDDLE_HARD;
        pronunciation = middlePtnPart.split(/\s+/);
        if (0 < lastPtnPart.length) {
          pronunciation = pronunciation.concat(lastPtnPart.split(/\s+/));
        }
      }
    }

    let voiceName = "";
    for (let idx = 1, len = srcAry.length; idx < len; idx += 2) {
      voiceName += srcAry[idx];
    }

    const obj = new ConvTblElm(voiceName, type, pronunciation, weight);
    obj.convTblElmStr = convTblElmStr;
    return obj;
  };

  ConvTblElm.prototype.type = ConvTblElm.TYPE_IGNORE;
  ConvTblElm.prototype.pronunciation = [];
  ConvTblElm.prototype.weight = 0;

  ConvTblElm.prototype.compare = function(obj){
   if (this.type !== obj.type) {
    return this.type - obj.type;
   }

   if (this.pronunciation.length !== obj.pronunciation.length) {
    return obj.pronunciation.length - this.pronunciation.length;
   }

   if (this.weight !== obj.weight) {
    return obj.weight - this.weight;
   }

   return this.index - obj.index;
  };

  ConvTblElm.prototype.appendPron = function(mapElm) {
    this.pronunciation = this.pronunciation.concat(mapElm.vals);
    this.weight = this.weight + mapElm.weight;
  };

  ConvTblElm.prototype.clearPron = function() {
    this.pronunciation = [];
    this.weight = 0;
  };

  ConvTblElm.prototype.clone = function() {
    return new ConvTblElm(this.voiceName, this.type,
      this.pronunciation, this.weight);
  };

  ConvTblElm.prototype.toString = function() {
    if (this.convTblElmStr) {
      return this.convTblElmStr;
    }

    let voiceParams = this.voiceName;
    if (this.voiceParams) {
      voiceParams = this.voiceParams.join("\t");
    }

    if (this.type === ConvTblElm.TYPE_IGNORE) {
      return "# " + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_INDEPENDENT) {
      return "^/" + this.pronunciation.join(" ") + "/$\t" + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_FIRST) {
      return "^/" + this.pronunciation.join(" ") + "/\t" + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_LAST) {
      return this.pronunciation[0] +
        "/" + this.pronunciation.slice(1).join(" ") + "/$\t" + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_LAST_HARD) {
      return "/" + this.pronunciation.join(" ") + "/$\t" + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_MIDDLE) {
      return this.pronunciation[0] +
        "/" + this.pronunciation.slice(1).join(" ") + "/\t" + voiceParams;
    } else if (this.type === ConvTblElm.TYPE_MIDDLE_HARD) {
      return "/" + this.pronunciation.join(" ") + "/\t" + voiceParams;
    }

    return "";
  };


  function makeConvTbl(names, mappingInfo) {
    var maps = mappingInfo.maps;
    var convTbl = [],
      convElms, convElmsIdx, convElmsLen, convElm, newConvElms;
    var namesIdx, namesLen, name, tmpName;
    var parts, partsIdx, partsLen;
    var part, partIdx, partLen, c, d;
    var map, mapIdx, mapLen, mapElm, key, keyLen, vals;
    var matchedVals, matchedValsIdx, matchedValsLen, matchedVal;
    var isHead, isTail;
    var isUnmatch;

    namesLen = names.length;
    for (namesIdx = 0; namesIdx < namesLen; ++namesIdx) {
      name = names[namesIdx];
      tmpName = name;
      convElms = [new ConvTblElm(name)];
      isUnmatch = false;

      for (let rp in mappingInfo.replacePatterns) {
        tmpName = tmpName.replace(rp.pattern, rp.value);
      }

      isHead = false;
      if (mappingInfo.headPattern !== null) {
        const splitName = tmpName.split(mappingInfo.headPattern);
        if (1 < splitName.length) {
          isHead = true;
          tmpName = splitName.join("");
        }
      }

      isTail = false;
      if (mappingInfo.tailPattern !== null) {
        const splitName = tmpName.split(mappingInfo.tailPattern);
        if (1 < splitName.length) {
          isTail = true;
          tmpName = splitName.join("");
        }
      }

      if (mappingInfo.splitPattern !== null) {
        const splitStrs = tmpName.split(mappingInfo.splitPattern);
        parts = splitStrs.filter(elm => 0 < elm.length);
      } else {
        parts = [tmpName];
      }
      partsLen = parts.length;
      for (partsIdx = 0; partsIdx < partsLen; ++partsIdx) {
        part = parts[partsIdx];
        partLen = part.length;
        for (partIdx = 0; partIdx < partLen;) {
          c = part.charAt(partIdx);
          if (!(c in maps)) {
            isUnmatch = true;
            break;
          }

          matchedVals = [];
          keyLen = -1;
          map = maps[c];
          mapLen = map.length;
          for (mapIdx = 0; mapIdx < mapLen; ++mapIdx) {
            mapElm = map[mapIdx];
            key = mapElm.key;
            d = part.substring(partIdx, partIdx + key.length);
            if (d === key) {
              if (mapElm.weight < 0) {
                break;
              }

              if (keyLen < 0) {
                keyLen = key.length;
                if (0 < mapElm.weight) {
                  matchedVals.push(mapElm);
                }
              } else if (keyLen === key.length) {
                if (0 < mapElm.weight) {
                  matchedVals.push(mapElm);
                }
              }
            }
          }

          if (keyLen < 0) {
            isUnmatch = true;
            break;
          }

          newConvElms = [
            []
          ];
          convElmsLen = convElms.length;
          for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
            convElm = convElms[convElmsIdx];
            newConvElms[0].push(convElm);
          }

          matchedValsLen = matchedVals.length;
          for (matchedValsIdx = 1; matchedValsIdx < matchedValsLen; ++matchedValsIdx) {
            newConvElms.push([]);
            for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
              convElm = convElms[convElmsIdx].clone();
              newConvElms[newConvElms.length - 1].push(convElm);
            }
          }

          convElms = [];
          matchedValsLen = matchedVals.length;
          for (matchedValsIdx = 0; matchedValsIdx < matchedValsLen; ++matchedValsIdx) {
            matchedVal = matchedVals[matchedValsIdx];
            for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
              convElm = newConvElms[matchedValsIdx][convElmsIdx];
              convElm.appendPron(matchedVal);
              convElms.push(convElm);
            }
          }

          partIdx += keyLen;
        }

        if (isUnmatch) {
          break;
        }
      }

      if (isUnmatch) {
        convElm = convElms[0];
        convElm.clearPron();
        convTbl.push(convElm);

      } else {
        if (isHead && isTail) {
          convElmsLen = convElms.length;
          for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
            convElm = convElms[convElmsIdx];
            convElm.type = ConvTbllm.TYPE_INDEPENDENT;
            convTbl.push(convElm);
          }

        } else if (isHead) {
          convElmsLen = convElms.length;
          for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
            convElm = convElms[convElmsIdx];
            convElm.type = ConvTblElm.TYPE_FIRST;
            convTbl.push(convElm);
          }

        } else if (isTail) {
          convElmsLen = convElms.length;
          for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
            convElm = convElms[convElmsIdx];
            convElm.type = ConvTblElm.TYPE_LAST;
            convTbl.push(convElm);
            convElm = convElm.clone();
            convElm.type = ConvTblElm.TYPE_LAST_HARD;
            convTbl.push(convElm);
          }

        } else {
          convElmsLen = convElms.length;
          for (convElmsIdx = 0; convElmsIdx < convElmsLen; ++convElmsIdx) {
            convElm = convElms[convElmsIdx];
            convElm.type = ConvTblElm.TYPE_MIDDLE;
            if (2 <= convElm.pronunciation.length) {
              convTbl.push(convElm);
            }
            convElm = convElm.clone();
            convElm.type = ConvTblElm.TYPE_MIDDLE_HARD;
            convTbl.push(convElm);
          }
        }
      }

    }

    Array.prototype.push.apply(convTbl, mappingInfo.bypass);

    convTbl.sort(function(a, b) {
      return a.compare(b);
    });

    return convTbl;
  }


  function CovertTableMaker() {
    this.otoIniData = null;
    this.mappingData = null;
    this.outputData = null;
  }

  CovertTableMaker.prototype.make = function() {
    var names = parseVoiceNames(this.otoIniData);
    var mappingInfo = parseMapping(this.mappingData);
    var convTbl = makeConvTbl(names, mappingInfo);
    var convTblIdx, convTblLen, convElm;
    var content = "",
      line;

    convTblLen = convTbl.length;
    for (convTblIdx = 0; convTblIdx < convTblLen; ++convTblIdx) {
      convElm = convTbl[convTblIdx];
      line = convElm.toString();
      content += line + "\u000D\u000A";
    }

    this.outputData = content;
    return content;
  };

  return CovertTableMaker;
})();
