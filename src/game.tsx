import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let numAces = 0;
  
  //loop through the hand's cards
  for (let card of hand){
    if (card.rank === 'ace') {
      numAces++
      score += 11
    } else if (card.rank === 'jack' || card.rank === 'queen' || card.rank === 'king'){
      score += 10
    } else {
      score += parseInt(card.rank)
    }
  }

  // decrease score above 21 if aces remain
  while (score > 21 && numAces > 0) {
    score -= 10;
    numAces--;
  }
    
  return score;
};

const determineGameResult = (state: GameState): GameResult => {
  let dealerResult = calculateHandScore(state.dealerHand);
  let playerResult = calculateHandScore(state.playerHand);
  let dealerCards = state.dealerHand.length
  let playerCards = state.playerHand.length

  if (dealerResult > 21 || playerResult > 21) {
    return dealerResult > playerResult ? 'player_win' : 'dealer_win';
  }
  if (dealerResult > playerResult) {
    return 'dealer_win';
  }
  if (playerResult > dealerResult) {
    return 'player_win';
  }
  if (playerResult === 21 && playerCards === 2 && dealerCards !== 2) { // condition also takes into account 'BlackJack' situation
    return 'player_win';
  }
  if (dealerResult === playerResult) {
    return 'draw';
  }


  return 'no_result';
};

//Player Actions
const playerStands = (state: GameState): GameState => {

  let remaining = state.cardDeck;
  let dealerHand = state.dealerHand.slice(); // Create a copy of the dealer's hand because below the state is passed by reference so we just update it

  // Keep taking cards for the dealer while their score is 16 or less
  while (calculateHandScore(dealerHand) <= 16) {
    const { card, remaining: newRemaining } = takeCard(remaining);
    dealerHand.push(card);
    remaining = newRemaining;
  }

  return {
    ...state,
    cardDeck: remaining,
    dealerHand,
    turn: "dealer_turn",
  };
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) !== "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
