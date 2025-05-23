// BarnebyAppNeu/constants/wordLists.ts
export interface WordCategory {
  categoryName: string;
  words: string[];
}

export const DEFAULT_WORD_LISTS: WordCategory[] = [
  {
    categoryName: "Obst",
    words: ["Apfel", "Banane", "Kirsche", "Orange", "Mango", "Pflaume", "Traube", "Ananas", "Kiwi", "Erdbeere", "Zitrone", "Melone"],
  },
  {
    categoryName: "Berufe",
    words: ["Arzt", "Lehrer", "Koch", "Pilot", "Polizist", "Richter", "Bäcker", "Feuerwehrmann", "Ingenieur", "Künstler", "Musiker", "Gärtner"],
  },
  {
    categoryName: "Tiere",
    words: ["Hund", "Katze", "Maus", "Elefant", "Löwe", "Tiger", "Bär", "Pferd", "Schaf", "Huhn", "Fisch", "Vogel"],
  },
  {
    categoryName: "Sportarten",
    words: ["Fußball", "Basketball", "Tennis", "Schwimmen", "Laufen", "Radfahren", "Yoga", "Boxen", "Golf", "Ski", "Surfen"],
  },
  {
    categoryName: "Musikinstrumente",
    words: ["Gitarre", "Klavier", "Schlagzeug", "Geige", "Flöte", "Trompete", "Saxophon", "Harfe", "Cello", "Ukulele"],
  }
];