/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voucher_roulette.json`.
 */
export type VoucherRoulette = {
  "address": "Adom7b6AmcmaPPLsB5bz8KZYN5NfuqYWeHLQ9jYeWBbY",
  "metadata": {
    "name": "voucherRoulette",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "redeemCode",
      "discriminator": [
        48,
        9,
        65,
        79,
        177,
        161,
        81,
        86
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "code",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "flag0",
      "msg": "s"
    },
    {
      "code": 6001,
      "name": "flag1",
      "msg": "t"
    },
    {
      "code": 6002,
      "name": "flag2",
      "msg": ""
    },
    {
      "code": 6003,
      "name": "flag3",
      "msg": "f"
    },
    {
      "code": 6004,
      "name": "flag4",
      "msg": "l"
    },
    {
      "code": 6005,
      "name": "flag5",
      "msg": "a"
    },
    {
      "code": 6006,
      "name": "flag6",
      "msg": "g"
    },
    {
      "code": 6007,
      "name": "flag7",
      "msg": "{{"
    },
    {
      "code": 6008,
      "name": "flag8",
      "msg": "g"
    },
    {
      "code": 6009,
      "name": "flag9",
      "msg": "0"
    },
    {
      "code": 6010,
      "name": "flag10",
      "msg": "0"
    },
    {
      "code": 6011,
      "name": "flag11",
      "msg": "d"
    },
    {
      "code": 6012,
      "name": "flag12",
      "msg": ""
    },
    {
      "code": 6013,
      "name": "flag13",
      "msg": "o"
    },
    {
      "code": 6014,
      "name": "flag14",
      "msg": "n"
    },
    {
      "code": 6015,
      "name": "flag15",
      "msg": "3"
    },
    {
      "code": 6016,
      "name": "flag16",
      "msg": "}}"
    },
    {
      "code": 6017,
      "name": "wrongLength",
      "msg": "Wrong length - must be exactly 17 characters"
    }
  ]
};
