'use strict';

export function convForPresamp(pronunciation) {
  var i1, z1, p, lyric, presampText = "";
  var s, prevIdx = null,
    pht, prevPHT = null;
  z1 = pronunciation.length;
  for (i1 = 0; i1 < z1; ++i1) {
    p = pronunciation[i1];
    s = p.src[p.src.length - 1];
    if (prevIdx !== s.src.idx) {
      prevIdx = s.src.idx;
      presampText += " ";
    }

    lyric = p.val.voName;
    pht = getHeadTailPron(lyric);
    if (prevPHT) {
      if (pht.head && prevPHT.tail === pht.head) {
        lyric = lyric.substring(pht.head.length);
      }
    }

    prevPHT = pht;

    presampText += lyric.replace(/[ -]+/g, "");
  }

  var words = presampText.trim().split(/ /),
    syllable, syllables = [];
  var word, ps;
  var i2, z2, p2, ps2, vt;
  var i3, z3, p3, ps3;
  for (i1 = 0, z1 = words.length; i1 < z1; ++i1) {
    word = words[i1];
    ps = getProns(word);
    if (cntVowels(ps) < 2) {
      syllables.push(word);
      continue;
    }

    ps2 = [];
    for (i2 = 0, z2 = ps.length; i2 < z2; ++i2) {
      p2 = ps[i2];
      if (isVowel(p2)) {
        if ((2 <= ps2.length) && (vt = findVowel(ps2))) {
          if (vt.type === 1) { // short vowel
            if (vt.pos < ps2.length - 1) {
              z3 = vt.pos + 1;
            } else {
              z3 = vt.pos;
            }
          } else { // long vowel
            z3 = vt.pos;
          }

          ps3 = [];
          for (i3 = 0; i3 <= z3; ++i3) {
            p3 = ps2.shift();
            ps3.push(p3);
          }

          syllable = ps3.join("");
          syllables.push(syllable);
        }

        ps2.push(p2);

      } else {
        ps2.push(p2);
      }
    }

    syllable = ps2.join("");
    syllables.push(syllable);
  }

  return syllables;
}

function getHeadTailPron(str) {
 var prons = [
"O",
"A",
"i",
"u",
"E",
"e",
"I",
"U",
"V",
"@",
"@",
"{",
"eI",
"aI",
"oU",
"aU",
"OI",
"3",
"@",
"p",
"b",
"t",
"d",
"k",
"g",
"tS",
"dZ",
"f",
"v",
"T",
"D",
"s",
"z",
"S",
"Z",
"h",
"m",
"m",
"n",
"n",
"N",
"N",
"l",
"l",
"r",
"r\\",
"4",
"4~",
"j",
"w",
"?"];
 var i, z = prons.length, plen, pron, p = {head:null, tail:null};
 for (i = 0; i < z; ++ i) {
  pron = prons[i];
  plen = pron.length;
  if (str.substring(0, plen) === pron && (!p.head || p.head.length < plen)) {
   p.head = pron;
  }
  if (str.substring(str.length - plen) === pron && (!p.tail || p.tail.length < plen)) {
   p.tail = pron;
  }
 }
 return p;
}

function getProns(str) {
 var prons = [], p;
 var pos = 0, endPos = str.length;
 while (pos < endPos) {
  p = getHeadTailPron(str.substring(pos));
  prons.push(p.head);
  pos += p.head.length;
 }

 return prons;
}

function isLongVowel(p) {
 var longVowels = {
"i": true,
"u": true,
"e": true,
"eI": true,
"aI": true,
"oU": true,
"aU": true,
"OI": true};
 return !(!(longVowels[p]));
}

function isShortVowel(p) {
 var shortVowels = {
"O": true,
"A": true,
"E": true,
"I": true,
"U": true,
"V": true,
"{": true,
"3": true,
"@": true};
 return !(!(shortVowels[p]));
}

function isVowel(p) {
 return isShortVowel(p) || isLongVowel(p);
}

function findVowel(ps) {
 var i, z, c = 0;
 for (i = 0, z = ps.length; i < z; ++ i) {
  if (isShortVowel(ps[i])) {
   return {type:1, pos:i};
  } else if (isLongVowel(ps[i])) {
   return {type:2, pos:i};
  }
 }
 return null;
}

function cntVowels(ps) {
 var i, z, c = 0;
 for (i = 0, z = ps.length; i < z; ++ i) {
  if (isVowel(ps[i])) {
   ++ c;
  }
 }
 return c;
}
