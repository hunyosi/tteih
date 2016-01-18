tteihconfig
===========

This is a tool to make a mapping file for TTEnglishInpurHelper.
The mapping file is configuration to convert from Arpabet sequence to voicebank entry.

How to use other voicebank
--------------------------

### 1. Create a file to map phonenic symbols of voicebank to Arpabet symbols.
    - see exampls:
        - "example\MinaraiMona_to_arpabet.tsv" -- for MinaraiMona
        - "example\x-sampa_to_arpabet.tsv" -- for generic X-SAMPA
    - file format:
        - Tab separated values format.
        - First line is not field captions. First line is data.
        - This file content is following rows set.

Normal row:

|fld no.|field value|description                              |
|:-----:|-----------|-----------------------------------------|
| 1     |symbol     |A phonenic symbol of voicebank.          |
| 2     |weight(>0) |This value is using to resolve priority. |
| 3     |arpabet    |A Arpabet symbol.                        |

Ignore symbol row:

|fld no.|field value|description                                                                  |
|:-----:|-----------|-----------------------------------------------------------------------------|
| 1     |symbol     |This is a phonenic symbol of voicebank.  This symbol is skip at making mapping file. |
| 2     |"0"        |                                                                             |
| 3     |"*ignore*" |                                                                             |

Excludion entry row:

|fld no.|field value |description                                                              |
|:-----:|------------|-------------------------------------------------------------------------|
| 1     |entry       |This is a entry name of voicebank.  This entry is commented out in mapping file. |
| 2     |"-1"        |                                                                         |
| 3     |"*invalid*" |                                                                         |

Head mark row:

|fld no.|field value|description                                                                 |
|:-----:|-----------|----------------------------------------------------------------------------|
| 1     |regexp     |This regular expression is a pattern of first symbols                                  |
| 2     |"-1"       |                                                                         |
| 3     |"*head*" n |                                                                         |



### 2. Make a mapping file for target voicebank
    - Execute "bin\tteihconfig.exe". And oparate using procedure given on the screen.

