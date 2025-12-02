'use client'

import EnhancedCard from '@/components/EnhancedCard'
import PremiumChip from '@/components/PremiumChip'

export default function TestAssetsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Premium Assets Test Page
        </h1>

        {/* Cards Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Premium Playing Cards</h2>
          <p className="text-white/80 mb-4">These should show actual card images from the purchased kit</p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Test each suit with Ace */}
            <EnhancedCard suit="spades" rank="A" />
            <EnhancedCard suit="hearts" rank="K" />
            <EnhancedCard suit="diamonds" rank="Q" />
            <EnhancedCard suit="clubs" rank="J" />
            <EnhancedCard suit="hearts" rank="10" />
            
            {/* Face down card */}
            <EnhancedCard suit="spades" rank="A" faceDown={true} />
          </div>
        </div>

        {/* Chips Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Premium Casino Chips</h2>
          <p className="text-white/80 mb-4">CSS-based casino chips with proper colors</p>
          
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <div className="text-center">
              <PremiumChip value={1} size="large" animated />
              <p className="text-white mt-2">$1</p>
            </div>
            <div className="text-center">
              <PremiumChip value={5} size="large" animated />
              <p className="text-white mt-2">$5</p>
            </div>
            <div className="text-center">
              <PremiumChip value={25} size="large" animated />
              <p className="text-white mt-2">$25</p>
            </div>
            <div className="text-center">
              <PremiumChip value={100} size="large" animated />
              <p className="text-white mt-2">$100</p>
            </div>
            <div className="text-center">
              <PremiumChip value={500} size="large" animated />
              <p className="text-white mt-2">$500</p>
            </div>
            <div className="text-center">
              <PremiumChip value={1000} size="large" animated />
              <p className="text-white mt-2">$1K</p>
            </div>
          </div>
        </div>

        {/* Card Mapping Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">All Ranks Test</h2>
          <p className="text-white/80 mb-4">Testing all card ranks in Hearts</p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(rank => (
              <div key={rank} className="text-center">
                <EnhancedCard suit="hearts" rank={rank} />
                <p className="text-white text-xs mt-1">{rank}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
          >
            Back to Game
          </a>
        </div>
      </div>
    </div>
  )
}
