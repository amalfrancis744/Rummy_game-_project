const constants = require("../util/constants");

const mapping = { A: 1, J: 11, Q: 12, K: 13 };

const SCORE10 = ["A", "J", "Q", "K"];

function cardDistribution(arr, n, players) {
  console.log("--------------------------------arr in card Distribution----------------->" , arr)
  let cardsOfPlayers = {};
  // random joker card
  let jokerCard = arr[Math.floor(Math.random() * arr.length)];
  if (jokerCard === "j1" || jokerCard === "j2") {
    jokerCard = "sA";
  }
  let jokerCards = [];
  //loop to push similar joker cards
  for (let k = 0; k < arr.length; k++) {
    const card = jokerCard.substring(1);
    const matchCard = arr[k].substring(1);
    if (matchCard === card) {
      jokerCards.push(arr[k]);
    }
  }
  //push joker cards
  if (jokerCards.indexOf("j1") === -1) {
    jokerCards.push("j1");
  }
  if (jokerCards.indexOf("j2") === -1) {
    jokerCards.push("j2");
  }
  // eslint-disable-next-line no-console
  console.log("joker-cards", jokerCards);
  //loop to divide card to players
  for (let i = 0; i < players; i++) {
    let arrCards = [];
    for (let j = 0; j < n; j++) {
      const randomIndex = Math.floor(Math.random() * arr.length);
      arrCards.push(arr[randomIndex]);
      arr.splice(randomIndex, 1);
    }
    cardsOfPlayers[`player${i}`] = arrCards;
  }
  // eslint-disable-next-line no-console
  
  return {
    ...cardsOfPlayers,
    closeDeck: arr,
    jokerCard,
    jokerCards,
  };
}

function checkUnique(arr) {
  return arr.length === new Set(arr).size;
}

function validateCards(groupOfCards, jokerCards) {
  let hasPureSequence = false,
    hasSecondarySequence = false;
  let groupScore = 0;
  
  for (let i = 0; i < groupOfCards.length; i++) {
    const cards = groupOfCards[i].cards;
    if (isPureSequence(cards)) {
      groupOfCards[i].type = constants.SEQUENCE.PURE_SEQUENCE;
      groupOfCards[i].isValid = true;
      hasPureSequence = true;
      console.log("ispure sequence valid : ",hasPureSequence)
    } else if (checkSet(cards, jokerCards)) {
      groupOfCards[i].type = constants.SEQUENCE.SET;
      groupOfCards[i].isValid = true;

    } else if (isSecondarySequence(cards, jokerCards) ) {
      {
        groupOfCards[i].type = constants.SEQUENCE.SEC_SEQUENCE;
        hasSecondarySequence = true;
        groupOfCards[i].isValid = true;
      }

    } else {
      groupOfCards[i].isValid = false;
      groupScore = calNotValidCardScore(groupOfCards,jokerCards);
    }
    groupOfCards[i].groupScore = groupScore;

   
  }

  console.log("checking all file status groupofcards",groupOfCards);

  console.log("Group Score is",groupScore);

  let setCount =0;

  groupOfCards.forEach((e) => {
    if (constants.SEQUENCE.SET === e.type) {
      setCount = setCount+1;
      if(setCount < 3)
      {
        e.isValid = true;
      }
      else
      {
        e.isValid = false;
      }

    } else if (constants.SEQUENCE.SEC_SEQUENCE === e.type) {
      e.isValid = true;
    }
    else if (constants.SEQUENCE.PURE_SEQUENCE === e.type) {
      e.isValid = true;
}});
  return groupOfCards;
}

function getRanks(input) {
  return input.map((e) => {
    const card = e.substr(1);
    if (card in mapping) {
      return mapping[card];
    }
    return +card;
  });
}

function getDifference(input) {
  const difference = [];
  for (let i = 0; i < input.length - 1; i++) {
    difference.push(input[i + 1] - input[i]);
  }
  return difference;
}

function padRanks(ranks) {
  const result = {
    first: [],
    second: [],
  };
  let key = "first";
  for (let i = 1; i < ranks.length; i++) {
    result[key].push(ranks[i - 1]);
    if (Math.abs(ranks[i - 1] - ranks[i]) > 1) {
      key = "second";
    }
  }
  if (Math.abs(ranks[ranks.length - 1] - ranks[ranks.length - 2]) > 1) {
    key = "second";
  }
  result[key].push(ranks[ranks.length - 1]);
  if (!result.second) return result.first;

  result.first.forEach((rank) => result.second.push(rank + 13));

  return result.second;
}

function isPureSequence(input) {
  if (input.length < 3 || input.some((e) => e.charAt(0) !== input[0].charAt(0))) 
  {
    return false;
  }
  const ranks = getRanks(input);
  if (!checkUnique(ranks)) {
    return false;
  }

  if(ranks.includes(13) && ranks.includes(2))
  {
    return false;
  }

  ranks.sort((a, b) => a - b);
  const difference = getDifference(ranks);

  if (!difference.find((e) => e !== 1)) {
    return true;
  }

  const paddedRanks = padRanks(ranks);
  const paddedRankDifference = getDifference(paddedRanks);
  return !paddedRankDifference.find((e) => e !== 1);
}

function checkSet(cards, jokerCards) {
  if (cards.length < 3) {
    return false;
  }
  const startsWithDifCard = [];
  cards.forEach((e) => {
    if (jokerCards.indexOf(e) !== -1) {
      return;
    }
    startsWithDifCard.push(e.substring(0, 1));
  });
  if (!checkUnique(startsWithDifCard)) {
    return false;
  }
  
  const endsWithSame = (arr) =>
    arr.every((e) => {
      if (jokerCards.indexOf(e) !== -1) {
        return true;
      }
    let firstCardWithoutJoker = arr.filter((e)=> !jokerCards.includes(e))[0];
    if(firstCardWithoutJoker)
    {
      var setCardIndex = firstCardWithoutJoker.substring(1);
    }

      return e.substring(1) === setCardIndex;
    });
  const result = endsWithSame(cards);
  return result;
}

function isSecondarySequence(input, joker) {
  if (isPureSequence(input)) {
    return true;
  }

  let firstCardWithoutJoker = input.filter((e)=> !joker.includes(e))[0];
  if(firstCardWithoutJoker)
  {
    var sequenceColor = firstCardWithoutJoker.charAt(0);
  }

  if (input.length < 3 || input.some((e) => e.charAt(0) !== sequenceColor  && !joker.includes(e))) {
    return false;
  }
  const filtered = input.filter((e) => !joker.includes(e));
  const ranks = getRanks(filtered);
  if (!checkUnique(ranks)) {
    return false;
  }

  if(ranks.includes(13) && ranks.includes(2))
  {
    return false;
  }

  ranks.sort((a, b) => a - b);
  const difference = getDifference(ranks);
  if (!difference.find((e) => e !== 1)) {
    return true;
  }

  const paddedRanks = padRanks(ranks);
  const paddedRankDifference = getDifference(paddedRanks);
  if (!paddedRankDifference.find((e) => e !== 1)) {
    return true;
  }
  const checkDff = (diffArray) => {
    const total = diffArray.reduce((a, b) => a + b, 0);
    const extraDiff = total - diffArray.length;
    return extraDiff <= input.length - filtered.length;
  };

  return checkDff(difference) || checkDff(paddedRankDifference);
}

function isValidSet(groupOfCards, jokerCards) {

  let isValid;
  const checkValidSet = validateCards(groupOfCards, jokerCards);
  const notValidSet = checkValidSet.filter((e) => e.isValid === false);
  if (notValidSet.length === 0) {
    const findPureSeq = checkValidSet.filter((e) => e.type === constants.SEQUENCE.PURE_SEQUENCE && e.cards.length >= 4).length;
    if (findPureSeq == 0) {
      isValid = false;
    } else {
      isValid = true;
    }
  } else {
    isValid = false;
  }
  return { isValid, notValidSet };
}

function tossWinner(tossPlayers) {
  const match = [];
  tossPlayers.forEach((e) => {
    let card = e.card.substring(1);
    if (card === "A") {
      card = 14;
      match.push(card);
      return;
    }
    if (card === "J") {
      card = 11;
      match.push(card);
      return;
    }
    if (card === "Q") {
      card = 12;
      match.push(card);
      return;
    }
    if (card === "K") {
      card = 13;
      match.push(card);
      return;
    }
    match.push(Number(card));
  });
  const max = Math.max(...match);
  tossPlayers.forEach((e, i) => {
    if (i === match.indexOf(max)) {
      e.isFirstPlayer = true;
    } else {
      e.isFirstPlayer = false;
    }
  });
  return { tossPlayers, firstPlayer: match.indexOf(max) };
}

function calNotValidCardScore(groupOfCards, jokerCards) {
  let score = 0;
  if (groupOfCards.length !== 0) {
    for (let i = 0; i < groupOfCards.length; i++) {
      groupOfCards[i].cards.forEach((e) => {
        if (jokerCards.indexOf(e) !== -1) {
          score += 0;
          return;
        }
        let card = e.substring(1);
        if (SCORE10.indexOf(card) !== -1) {
          score += 10;
          return;
        }
        score += Number(card);
      });
    }
  }
  return score;
}

module.exports = {
  cardDistribution,
  isValidSet,
  validateCards,
  tossWinner,
  calNotValidCardScore,
};
