// BarnebyAppNeu/types/gameTypes.ts
export interface Player {
  id: string;
  name: string;
  role: 'Erzfeind' | 'Wortkenner';
  secretWord?: string;
  fellowArchEnemies?: string[]; // New: To show other Arch Enemies
}

export type GamePhase =
  | 'Setup'
  | 'RoleReveal'
  | 'WordPhase'
  | 'Resolution';

export interface GameSettings {
  numberOfPlayers: number;
  playerNames: string[];
  numberOfErzfeinde: 1 | 2;
  roundTimeInSeconds: 30 | 60 | 120 | 180 | 300;
  selectedCategory?: string;
  hintModeEnabled: boolean;
}

export interface GameState extends GameSettings {
  players: Player[];
  gamePhase: GamePhase;
  currentSecretWord: string;
  currentCategory: string;
  currentPlayerTurnForRoleReveal: number;
  timerValue: number;
  isTimerRunning: boolean;
  isLoading: boolean;
  roundEndReason?: string;
}