const SERVICES = {
  all: "placeholder-for-all-services",
  game: "mgp-game",
  iam: "mgp-iam",
  ludo: "mgp-ludo",
  promotion: "mgp-promotion",
  user: "mgp-user",
  vault: "mgp-vault",
  wallet: "mgp-wallet",
  payment: "mgp-payment",
  notification: "mgp-notification",
  rummy: "rummy",
};

const SERVICE_ENDPOINT_MAPPING = {
  "mgp-game": "MGP_GAME_ENDPOINT",
  "mgp-iam": "MGP_IAM_ENDPOINT",
  "mgp-ludo": "MGP_LUDO_ENDPOINT",
  "mgp-promotion": "MGP_PROMOTION_ENDPOINT",
  "mgp-user": "MGP_USER_ENDPOINT",
  "mgp-vault": "MGP_VAULT_ENDPOINT",
  "mgp-wallet": "MGP_WALLET_ENDPOINT",
  "mgp-payment": "MGP_PAYMENT_ENDPOINT",
  "mgp-notification": "MGP_NOTIFICATION_ENDPOINT",
  "mgp-fruit-chop": "MGP_FRUIT_CHOP_ENDPOINT",
  "mgp-bubble-shooter": "MGP_BUBBLE_SHOOTER_ENDPOINT",
  "mgp-carrom": "MGP_CARROM_ENDPOINT",
  "mgp-rummy": "MGP_RUMMY_ENDPOINT",
};

const URL_EXPIRE_SECONDS = {
  seconds: 3600,
};

const RUMMY_POINTS = {
  MAX_101: "101",
  MAX_201: "201",
  MAX_80: "80",
};

const ROUNDS = {
  BESTOFTWO : "2",
  BESTOFTHREE : "3"
}

const RUMMY_TYPE = {
  POOL: "pool",
  POINT: "point",
};

const RUMMY_MODES = {
  BESTOFTHREE : "BEST OF 3",
  BESTOFTWO : "BEST OF 2",
  PLAYWITHFRIENDS :"PLAY WITH FRIENDS"
}

const SEQUENCE = {
  PURE_SEQUENCE: "Pure Sequence",
  SET: "set",
  SEC_SEQUENCE: "Impure Sequence",
};

const RUPEE_PER_DROP = 25;

const RUMMY_TYPE_MAPPING = {
  POOL: "Pool Rummy",
  POINT: "Point Rummy",
};

module.exports = {
  SERVICE_NAME: SERVICES.rummy,
  SERVICES,
  RUMMY_POINTS,
  ROUNDS,
  SERVICE_ENDPOINT_MAPPING,
  URL_EXPIRE_SECONDS,
  RUMMY_TYPE,
  SEQUENCE,
  RUPEE_PER_DROP,
  RUMMY_MODES,
  RUMMY_TYPE_MAPPING,
};
