import reactionTest from "./reaction-test.js";
import colorRush from "./color-rush.js";
import numberFlash from "./number-flash.js";
import fastFingers from "./fast-fingers.js";
import quickDraw from "./quick-draw.js";
import ticTacToe from "./tic-tac-toe.js";
import connectFour from "./connect-four.js";
import checkers from "./checkers.js";
import battleship from "./battleship.js";
import memoryCards from "./memory-cards.js";
import patternMaster from "./pattern-master.js";
import wordScramble from "./word-scramble.js";
import mathDuel from "./math-duel.js";
import sequenceMaster from "./sequence-master.js";
import speedTyping from "./speed-typing.js";

export const gameRegistry = new Map([
  [reactionTest.id,reactionTest],[colorRush.id,colorRush],[numberFlash.id,numberFlash],
  [fastFingers.id,fastFingers],[quickDraw.id,quickDraw],[ticTacToe.id,ticTacToe],
  [connectFour.id,connectFour],[checkers.id,checkers],[battleship.id,battleship],
  [memoryCards.id,memoryCards],[patternMaster.id,patternMaster],[wordScramble.id,wordScramble],
  [mathDuel.id,mathDuel],[sequenceMaster.id,sequenceMaster],[speedTyping.id,speedTyping]
]);
