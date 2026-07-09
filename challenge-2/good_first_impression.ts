/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/good_first_impression.json`.
 */
export type GoodFirstImpression = {
  "address": "4tzADDiVAKviEf1Yi7GDiKG21MmLPgwkjVtaGvtheVCy",
  "metadata": {
    "name": "goodFirstImpression",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "getFlag",
      "discriminator": [
        60,
        47,
        79,
        236,
        252,
        145,
        243,
        53
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedFlag",
      "msg": "Can't get flag."
    }
  ]
};
