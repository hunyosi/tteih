/*
# [COPYING]
#     TTEnglishInputHelper
#     Copyright (C) 2015 ASAKURA, Hunyosi
#
#     This Source Code Form is subject to the terms of
#     the Mozilla Public License, v. 2.0.
#     If a copy of the MPL was not distributed with this file,
#     You can obtain one at http://mozilla.org/MPL/2.0/.
# [/COPYING]
*/

function cvre(ptn) {
 var SingleVowelChar = "AEIOUY";
 var SingleConsonantChar = "BCDFGHJKLMNPQRSTVXZ";
 var parts = ptn.split(/(\[(?:\\\]|[^\]])*\])/), partsIdx, partsLen = parts.length, part, part2;
 var reStr = "", before, after;
 var obj = null;
 var m;

 for (partsIdx = 0; partsIdx < partsLen; ++ partsIdx) {
  part = parts[partsIdx];
  if (0 < part.length && part.charAt(0) === "[" && part.charAt(part.length - 1)) {
   before = "";
   after = "";
  } else {
   before = "[";
   after = "]";
  }

  part2 = part;
  part2 = part2.replace("<C>", before + SingleConsonantChar + after, "g");
  part2 = part2.replace("<V>", before + SingleVowelChar + after, "g");
  reStr += part2;
 }

 if (0 < reStr.length) {
  if (m = /^\(\?<([=!])([^\)]+)\)/.exec(reStr)) {
   reStr = "^" + reStr.substring(m[0].length);
   obj = {
    re: new RegExp(reStr),
    reStr: reStr,
    wordTop: false,
    backCondRE: new RegExp(m[2] + "$"),
    backCondMatch: (m[1] === "=")
   };
  } else if (reStr.charAt(0) === "^") {
   obj = {
    re: new RegExp(reStr),
    reStr: reStr,
    wordTop: true
   };
  } else {
   reStr = "^" + reStr;
   obj = {
    re: new RegExp(reStr),
    reStr: reStr,
    wordTop: false
   }
  }
 }

 return obj;
}


var EnglishWritingElements = [

 {ptn: "WOMEN", len:5, pronun:["W", "IH", "M", "AH", "N"], prev:null, next:null},

 {ptn: cvre("ATION"), len:3, pronun:["EY", "SH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("ETION"), len:3, pronun:["IY", "SH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("ITION"), len:3, pronun:["IH", "SH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("OTION"), len:3, pronun:["OW", "SH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("UTION"), len:3, pronun:["Y", "UW", "SH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("STION"), len:3, pronun:["S", "CH", "AH", "N"], prev:null, next:[{mch:0, start:1, len:1}]},

 {ptn: cvre("(?<=<C>)IGN$"), len:3, pronun:["AY", "N"], prev:null, next:null},
 {ptn: cvre("(?<=<C>)IGH(<C>|$)"), len:3, pronun:["AY"], prev:null, next:null},

 {ptn: "EAR", len:3, pronun:["ER"], prev:null, next:null},
 {ptn: "EER", len:3, pronun:["IH", "ER"], prev:null, next:null},
 {ptn: "IER", len:3, pronun:["IH", "ER"], prev:null, next:null},
 {ptn: "OAR", len:3, pronun:["AO", "ER"], prev:null, next:null},
 {ptn: "OOR", len:3, pronun:["UH", "ER"], prev:null, next:null},
 {ptn: "OUR", len:3, pronun:["AA", "UH", "ER"], prev:null, next:null},
 {ptn: "OWER", len:3, pronun:["AA", "UH", "ER"], prev:null, next:null},

 {ptn: cvre("ARE$"), len:3, pronun:["EH", "ER"], prev:null, next:null},
 {ptn: cvre("ERE$"), len:3, pronun:["IH", "ER"], prev:null, next:null},
 {ptn: cvre("IRE$"), len:3, pronun:["AY", "ER"], prev:null, next:null},
 {ptn: cvre("URE$"), len:3, pronun:["Y", "UH", "ER"], prev:null, next:null},
 {ptn: cvre("ORE$"), len:3, pronun:["AO", "ER"], prev:null, next:null},

 {ptn: cvre("A<C>E$"), len:3, pronun:["EY"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("E<C>E$"), len:3, pronun:["IY"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("I<C>E$"), len:3, pronun:["AY"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("O<C>E$"), len:3, pronun:["OW"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("U<C>E$"), len:3, pronun:["Y", "UW"], prev:null, next:[{mch:0, start:1, len:1}]},
 {ptn: cvre("Y<C>E$"), len:3, pronun:["AY"], prev:null, next:[{mch:0, start:1, len:1}]},

 {ptn: cvre("BLE$"), len:3, pronun:["B", "AH", "L"], prev:null, next:null},

 {ptn: "TCH", len:3, pronun:["CH"], prev:null, next:null},

 {ptn: "EA", len:2, pronun:["IY"], prev:null, next:null},
 {ptn: "EE", len:2, pronun:["IY"], prev:null, next:null},
 {ptn: cvre("(?<!^)IE(?!$)"), len:2, pronun:["IY"], prev:null, next:null},
 {ptn: "AI", len:2, pronun:["EY"], prev:null, next:null},
 {ptn: "AY", len:2, pronun:["EY"], prev:null, next:null},
 {ptn: "EI", len:2, pronun:["EY"], prev:null, next:null},
 {ptn: "EY", len:2, pronun:["EY"], prev:null, next:null},
 {ptn: "OI", len:2, pronun:["OY"], prev:null, next:null},
 {ptn: "OY", len:2, pronun:["OY"], prev:null, next:null},
 {ptn: "AU", len:2, pronun:["AO"], prev:null, next:null},
 {ptn: "EU", len:2, pronun:["Y", "UW"], prev:null, next:null},
 {ptn: "EW", len:2, pronun:["Y", "UW"], prev:null, next:null},
 {ptn: "OU", len:2, pronun:["AW"], prev:null, next:null},
 {ptn: "OA", len:2, pronun:["OW"], prev:null, next:null},
 {ptn: cvre("OO([DKT]|C([^EIY]|$))"), len:2, pronun:["UH"], prev:null, next:null},
 {ptn: cvre("OO"), len:2, pronun:["UW"], prev:null, next:null},

 {ptn: cvre("ER(<C>|$)"), len:2, pronun:["ER"], prev:null, next:null},
 {ptn: cvre("IR(<C>|$)"), len:2, pronun:["ER"], prev:null, next:null},
 {ptn: cvre("UR(<C>|$)"), len:2, pronun:["ER"], prev:null, next:null},
 {ptn: cvre("AR(<C>|$)"), len:2, pronun:["AA", "ER"], prev:null, next:null},
 {ptn: cvre("OR(<C>|$)"), len:2, pronun:["AO", "ER"], prev:null, next:null},

 {ptn: cvre("^[KG]N"), len:2, pronun:["N"], prev:null, next:null},
 {ptn: cvre("^WR"), len:2, pronun:["R"], prev:null, next:null},

 {ptn: cvre("GH(<C>|$)"), len:2, pronun:[], prev:null, next:null},

 {ptn: cvre("BT$"), len:2, pronun:["T"], prev:null, next:null},
 {ptn: cvre("MB$"), len:2, pronun:["M"], prev:null, next:null},
 {ptn: cvre("GN$"), len:2, pronun:["N"], prev:null, next:null},
 {ptn: cvre("MN$"), len:2, pronun:["N"], prev:null, next:null},

 {ptn: "CH", len:2, pronun:["CH"], prev:null, next:null},
 {ptn: "CK", len:2, pronun:["K"], prev:null, next:null},
 {ptn: "DG", len:2, pronun:["JH"], prev:null, next:null},
 {ptn: "DJ", len:2, pronun:["JH"], prev:null, next:null},
 {ptn: "NG", len:2, pronun:["NG"], prev:null, next:null},
 {ptn: "PH", len:2, pronun:["F"], prev:null, next:null},
 {ptn: "QU", len:2, pronun:["K", "W"], prev:null, next:null},
 {ptn: "SH", len:2, pronun:["SH"], prev:null, next:null},
 {ptn: "TH", len:2, pronun:["TH"], prev:null, next:null},
 {ptn: "WH", len:2, pronun:["W"], prev:null, next:null},

 {ptn: cvre("C([^EIY]|$)"), len:1, pronun:["K"], prev:null, next:null},
 {ptn: cvre("C[EIY]"), len:1, pronun:["S"], prev:null, next:null},
 {ptn: cvre("G([^EIY]|$)"), len:1, pronun:["G"], prev:null, next:null},
 {ptn: cvre("G[EIY]"), len:1, pronun:["JH"], prev:null, next:null},

 {ptn: cvre("(?<=<C>)E$"), len:1, pronun:[], prev:null, next:null},

 {ptn: cvre("R<V>"), len:1, pronun:["R"], prev:null, next:null},
 {ptn: cvre("W<V>"), len:1, pronun:["W"], prev:null, next:null},
 {ptn: cvre("Y<V>"), len:1, pronun:["Y"], prev:null, next:null},

 {ptn: "B", len:1, pronun:["B"], prev:null, next:null},
 {ptn: "D", len:1, pronun:["D"], prev:null, next:null},
 {ptn: "F", len:1, pronun:["F"], prev:null, next:null},
 {ptn: "H", len:1, pronun:["HH"], prev:null, next:null},
 {ptn: "J", len:1, pronun:["JH"], prev:null, next:null},
 {ptn: "K", len:1, pronun:["K"], prev:null, next:null},
 {ptn: "L", len:1, pronun:["L"], prev:null, next:null},
 {ptn: "M", len:1, pronun:["M"], prev:null, next:null},
 {ptn: "N", len:1, pronun:["N"], prev:null, next:null},
 {ptn: "P", len:1, pronun:["P"], prev:null, next:null},
 {ptn: "S", len:1, pronun:["S"], prev:null, next:null},
 {ptn: "T", len:1, pronun:["T"], prev:null, next:null},
 {ptn: "V", len:1, pronun:["V"], prev:null, next:null},
 {ptn: "X", len:1, pronun:["K", "S"], prev:null, next:null},
 {ptn: "Z", len:1, pronun:["Z"], prev:null, next:null},

 {ptn: "A", len:1, pronun:["AE"], prev:null, next:null},
 {ptn: "E", len:1, pronun:["EH"], prev:null, next:null},
 {ptn: "I", len:1, pronun:["IH"], prev:null, next:null},
 {ptn: "O", len:1, pronun:["AA"], prev:null, next:null},
 {ptn: "U", len:1, pronun:["AH"], prev:null, next:null},
 {ptn: "Y", len:1, pronun:["IH"], prev:null, next:null},

 null
];


export function convUnknownEnglishWord(word)
{
 var wd = word.trim().toUpperCase();
 var p = convUnknownEnglishWordSuffix(wd);
 if (! p) {
  return null;
 }

 p = deleteDoubleConsonant(p);
 p = deleteY(p);
 p = modifyAfterWVowel(p);
 return p;
}


function convUnknownEnglishWordSuffix(word)
{
 var m, ptn;

 function callImpl(wd, suffix, suffixp, suffixFilter) {
  var p = [], p2;

  p2 = convUnknownEnglishWordSuffix(wd);
  if (!p2) {
   return null;
  }
  append(p, p2);

  if (suffixp) {
   append(p, suffixp);
  } else {
   p2 = convUnknownWordImpl(EnglishWritingElements, suffix, 0, suffix.length);
   if (!p2) {
    return null;
   }
   if (suffixFilter) {
    p2 = suffixFilter(p2, p);
   }
   append(p, p2);
  }

  return p;
 }

 function callImpl4ed(wd, suffix) {
  if (suffix === "ED") {
   var p = convUnknownEnglishWordSuffix(wd);
   if (! p) {
    return null;
   }

   var last = p[p.length - 1];
   if (last === "T" || last === "D") {
    append(p, ["EH", "D"]);
   } else if (last === "CH" || last === "F" || last === "K" || last === "P"
     || last === "S" || last === "SH" || last === "TH") {
    p.push("T");
   } else {
    p.push("D");
   }
   return p;
  } else {
   return callImpl(wd, suffix);
  }
 }

 m = /^(...+)(PROOF|WOMEN|HOOD|FREE|SHIP)$/.exec(word);
 if (m) {
  return callImpl(m[1], m[2]);
 }

 m = /^(...+)(WOMAN|MENT|LESS|M[AE]N|FUL|DOM)$/.exec(word);
 if (m) {
  return callImpl(m[1], m[2], null, function(p){
   var pIdx;
   for (pIdx = p.length - 1; 0 <= pIdx; -- pIdx) {
    if (/^[AE]/.test(p[pIdx])) {
     p[pIdx] = "AH";
     break;
    }
   }
   return p;
  });
 }

 ptn = cvre("^(.*<V>(CK|FF|GG|KK|LL|MM|NN|PP|RR|SS|TT|VV|ZZ)|.*<V><V>|...+<V>)(ED|ING)$");
 m = ptn.re.exec(word);
 if (m) {
  return callImpl4ed(m[1], m[m.length - 1]);
 }

 m = cvre("^(.*<V>.*<C>)(ED|ING)$").re.exec(word);
 if (m) {
  return callImpl4ed(m[1] + "E", m[2]);
 }

 m = cvre("^(..+(<V>[SZ]|[CG])E)'?S$").re.exec(word);
 if (m) {
  return callImpl(m[1], null, ["IH", "Z"]);
 }

 m = cvre("^(..+(CH|SH|S|Z))[E']S$").re.exec(word);
 if (m) {
  return callImpl(m[1], null, ["IH", "Z"]);
 }

 if (! (/^.*(CH|SH|S|Z)S$/.test(word))) {
  m = cvre("^((<V>.+<C>|.+<V>.*<C>)[E']?|(..+<V>)')S$").re.exec(word);
  if (m) {
   var wd = m[1];
   if (wd.charAt(wd.length - 1) === "'") {
    wd = wd.substring(wd, wd.length - 1);
   }

   var p = convUnknownEnglishWordSuffix(wd);
   if (! p) {
    return null;
   }

   var last = p[p.length - 1];
   if (last === "F" || last === "K" || last === "P" || last === "T" ||
     last === "TH") {
    p.push("S");
   } else {
    p.push("Z");
   }

   return p;
  }
 }


 return convUnknownWordImpl(EnglishWritingElements, word, 0, word.length);
}


function deleteDoubleConsonant(p) {
 var ConsonantChars = {
  "B": true,
  "CH": true,
  "D": true,
  "DH": true,
  "F": true,
  "G": true,
  "HH": true,
  "JH": true,
  "K": true,
  "L": true,
  "M": true,
  "N": true,
  "P": true,
  "R": true,
  "S": true,
  "T": true,
  "V": true,
  "Z": true,
  "ZH": true
 };
 var p2 = [];
 var pe, prev = null;
 var i, z = p.length;
 for (i = 0; i < z; ++ i) {
  pe = p[i];
  if (! (prev && pe in ConsonantChars && pe === prev)) {
   p2.push(pe);
  }

  prev = pe;
 }

 return p2;
}


function deleteY(p) {
 var TargetChars = {
  "CH": true,
  "JH": true,
  "L": true,
  "R": true,
  "S": true,
 };
 var p2 = [];
 var pe, prev = null;
 var i, z = p.length;
 for (i = 0; i < z; ++ i) {
  pe = p[i];
  if (! (prev && prev in TargetChars && pe === "Y")) {
   p2.push(pe);
  }

  prev = pe;
 }

 return p2;
}


function modifyAfterWVowel(p) {
 var p2 = [];
 var pe;
 var i, z = p.length, x;
 for (i = 0; i < z; ++ i) {
  pe = p[i];
  p2.push(pe);

  x = p2.length - 1;
  if (3 <= p2.length) {
   if (p2[x - 2] === "W" && p2[x - 1] === "AA" && p2[x] === "ER") {
    p2[x - 1] = "AO";
   } else if (p2[x - 2] === "W" && p2[x - 1] === "AO" && p2[x] === "ER") {
    p2[x - 1] = "AO";
    p2.pop();
   } else if (p2[x - 2] === "W" && p2[x - 1] === "AE") {
    p2[x - 1] = "AA";
   } else if (p2[x - 2] === "W" && p2[x - 1] === "AA") {
    p2[x - 1] = "AH";
   }
  }

  prev = pe;
 }

 x = p2.length - 1;
 if (p2.length === 2) {
  if (p2[x - 1] === "W" && p2[x] === "AE") {
   p2[x] = "AA";
  } else if (p2[x - 1] === "W" && p2[x] === "AA") {
   p2[x] = "AH";
  }
 }

 return p2;
}


function append(a, b)
{
 Array.prototype.push.apply(a, b);
}


function convMachedPart(ewe, mch, nxt)
{
 var mchIdx, mchLen, m, nxtIdx, nxtLen, nxtObj, nxtStart, nxtEnd, p2, pp;

 p2 = [];

 mchLen = mch.length;
 for (nxtIdx = 0, nxtLen = nxt.length; nxtIdx < nxtLen; ++ nxtIdx) {
  nxtObj = nxt[nxtIdx];
  mchIdx = nxtObj.mch;
  if (mchLen < mchIdx) {
   continue;
  }

  m = mch[mchIdx];
  nxtStart = 0;
  nxtEnd = m.length;

  if (nxtObj.start) {
   nxtStart = nxtObj.start;
  }

  if (nxtObj.len) {
   nxtEnd = nxtStart + nxtObj.len;
  }

  pp = convUnknownWordImpl(ewe, m, nxtStart, nxtEnd);
  if (! pp) {
   return null;
  }

  append(p2, pp);
 }

 return p2;
}

function convUnknownWordImpl(ewe, wd, wdIdx, wdLen)
{
 var eweIdx = 0, eweLen = ewe.length - 1, e;
 var pronunciation = [], p;
 var ptn, partWd;
 var p2, pp;

 while (wdIdx < wdLen) {
  p = null;
  for (eweIdx = 0; eweIdx < eweLen; ++ eweIdx) {
   e = ewe[eweIdx];
   ptn = e.ptn;
   if (typeof (ptn) === "string") {
    partWd = wd.substring(wdIdx, wdIdx + ptn.length);
    if (partWd === ptn) {
     p = e.pronun;
     wdIdx += e.len;
     break;
    }
   } else {
    if (ptn.wordTop && wdIdx !== 0) {
     continue;
    }

    if (ptn.backCondRE) {
     partWd = wd.substring(0, wdIdx);
     mch = ptn.backCondRE.exec(partWd);
     if ((! ptn.backCondMatch) !== (! mch)) {
      continue;
     }
    }

    partWd = wd.substring(wdIdx);
    mch = ptn.re.exec(partWd);
    if (mch) {
     p2 = [];

     if (e.prev) {
      pp = convMachedPart(ewe, mch, e.prev);
      if (! pp) {
       p2 = null;
      } else {
       append(p2, pp);
      }
     }

     if (p2) {
      Array.prototype.push.apply(p2, e.pronun);
     }

     if (p2 && e.next) {
      pp = convMachedPart(ewe, mch, e.next);
      if (! pp) {
       p2 = null;
      } else {
       append(p2, pp);
      }
     }

     if (p2) {
      p = p2;
      wdIdx += e.len;
      break;
     }
    }
   }
  }

  if (! p) {
   return null;
  }

  append(pronunciation, p);
 }

 return pronunciation;
}
