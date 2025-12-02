/**
 * Card Image Mapper
 * Maps our card format to the purchased premium card PNG filenames
 * 
 * Card file naming convention from kit:
 * _0000_C-K.png (Clubs King)
 * _0025_D-A.png (Diamonds Ace)
 * _0038_H-A.png (Hearts Ace)
 * _0051_S-A.png (Spades Ace)
 * _0052_BACK.png (Card back)
 */

// Suit mapping
const suitMap: { [key: string]: string } = {
  'hearts': 'H',
  'diamonds': 'D',
  'clubs': 'C',
  'spades': 'S'
}

// Rank mapping
const rankMap: { [key: string]: string } = {
  'A': 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K'
}

// File number mapping for each card (based on actual file names)
const cardFileNumbers: { [key: string]: string } = {
  // Clubs (C)
  'C-K': '0000',
  'C-Q': '0001',
  'C-J': '0002',
  'C-10': '0003',
  'C-9': '0004',
  'C-8': '0005',
  'C-7': '0006',
  'C-6': '0007',
  'C-5': '0008',
  'C-4': '0009',
  'C-3': '0010',
  'C-2': '0011',
  'C-A': '0012',
  
  // Diamonds (D)
  'D-K': '0013',
  'D-Q': '0014',
  'D-J': '0015',
  'D-10': '0016',
  'D-9': '0017',
  'D-8': '0018',
  'D-7': '0019',
  'D-6': '0020',
  'D-5': '0021',
  'D-4': '0022',
  'D-3': '0023',
  'D-2': '0024',
  'D-A': '0025',
  
  // Hearts (H)
  'H-K': '0026',
  'H-Q': '0027',
  'H-J': '0028',
  'H-10': '0029',
  'H-9': '0030',
  'H-8': '0031',
  'H-7': '0032',
  'H-6': '0033',
  'H-5': '0034',
  'H-4': '0035',
  'H-3': '0036',
  'H-2': '0037',
  'H-A': '0038',
  
  // Spades (S)
  'S-K': '0039',
  'S-Q': '0040',
  'S-J': '0041',
  'S-10': '0042',
  'S-9': '0043',
  'S-8': '0044',
  'S-7': '0045',
  'S-6': '0046',
  'S-5': '0047',
  'S-4': '0048',
  'S-3': '0049',
  'S-2': '0050',
  'S-A': '0051',
}

/**
 * Get the card image filename for a given suit and rank
 * @param suit - 'hearts', 'diamonds', 'clubs', or 'spades'
 * @param rank - 'A', '2'-'10', 'J', 'Q', 'K'
 * @returns The filename (e.g., '_0025_D-A.png') or card back if invalid
 */
export function getCardImagePath(suit: string, rank: string): string {
  // Normalize inputs to lowercase for suit, uppercase for rank
  const normalizedSuit = suit.toLowerCase()
  const normalizedRank = rank.toUpperCase()
  
  // Map to file naming convention
  const suitCode = suitMap[normalizedSuit]
  const rankCode = rankMap[normalizedRank]
  
  if (!suitCode || !rankCode) {
    console.warn(`Invalid card: ${suit} ${rank}`)
    return '/cards/_0052_BACK.png' // Return card back for invalid cards
  }
  
  const cardKey = `${suitCode}-${rankCode}`
  const fileNumber = cardFileNumbers[cardKey]
  
  if (!fileNumber) {
    console.warn(`No file mapping for: ${cardKey}`)
    return '/cards/_0052_BACK.png'
  }
  
  return `/cards/_${fileNumber}_${cardKey}.png`
}

/**
 * Get the card back image path
 */
export function getCardBackPath(): string {
  return '/cards/_0052_BACK.png'
}

/**
 * Get suit color for styling
 */
export function getSuitColor(suit: string): string {
  const normalizedSuit = suit.toLowerCase()
  return normalizedSuit === 'hearts' || normalizedSuit === 'diamonds' 
    ? '#DC2626' 
    : '#000000'
}

/**
 * Get suit symbol
 */
export function getSuitSymbol(suit: string): string {
  const symbols: { [key: string]: string } = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  }
  return symbols[suit.toLowerCase()] || suit
}

/**
 * Preload all card images for better performance
 */
export function preloadCardImages(): void {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      const img = new Image()
      img.src = getCardImagePath(suit, rank)
    })
  })
  
  // Preload card back
  const backImg = new Image()
  backImg.src = getCardBackPath()
}
