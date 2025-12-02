'use client'

interface DemoCredentialsProps {
  onLogin: (username: string, password: string) => void
}

export default function DemoCredentials({ onLogin }: DemoCredentialsProps) {
  const credentials = [
    {
      type: 'Admin Account',
      username: 'admin',
      password: 'admin123',
      description: 'Access admin dashboard with user management'
    },
    {
      type: 'Manager Account',
      username: 'manager1',
      password: 'manager123',
      description: 'Can send credits to players'
    },
    {
      type: 'Player Account',
      username: 'player1',
      password: 'player123',
      description: 'Regular player with 1000 credits'
    }
  ]

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
      <h3 className="text-blue-300 font-bold mb-3">🎮 Demo Credentials (Development Mode)</h3>
      <div className="space-y-3">
        {credentials.map((cred, index) => (
          <div key={index} className="bg-black/20 rounded p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-yellow-300 font-medium">{cred.type}</div>
                <div className="text-gray-300 text-sm">
                  Username: <span className="text-white font-mono">{cred.username}</span> | 
                  Password: <span className="text-white font-mono">{cred.password}</span>
                </div>
                <div className="text-gray-400 text-xs">{cred.description}</div>
              </div>
              <button
                onClick={() => onLogin(cred.username, cred.password)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
              >
                Auto Fill
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        💡 Install MongoDB to enable full database functionality
      </div>
    </div>
  )
}