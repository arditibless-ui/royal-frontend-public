// Mock API service for client-side demo (no backend required)
interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'player';
  credits: number;
  status: 'active' | 'inactive';
}

// Mock users for demo
const mockUsers: User[] = [
  {
    _id: 'admin123',
    username: 'admin',
    email: 'admin@poker.com',
    password: 'admin123', // In real app this would be hashed
    role: 'admin',
    credits: 10000,
    status: 'active'
  },
  {
    _id: 'user123',
    username: 'player1',
    email: 'player1@poker.com',
    password: 'player123',
    role: 'player',
    credits: 1000,
    status: 'active'
  }
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication functions
export const mockAuth = {
  async login(email: string, password: string) {
    await delay(500); // Simulate network delay
    
    const user = mockUsers.find(u => 
      (u.email === email || u.username === email) && u.password === password
    );
    
    if (user) {
      const token = `mock-token-${user._id}`;
      // Store in localStorage for persistence (use 'token' key to match main app)
      localStorage.setItem('token', token);
      localStorage.setItem('poker_user', JSON.stringify({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        credits: user.credits,
        status: user.status
      }));
      
      return {
        success: true,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          credits: user.credits,
          status: user.status
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  },

  async register(userData: { username: string; email: string; password: string }) {
    await delay(500);
    
    // Check if user already exists
    const existing = mockUsers.find(u => 
      u.email === userData.email || u.username === userData.username
    );
    
    if (existing) {
      return {
        success: false,
        message: 'User already exists'
      };
    }
    
    // Create new user
    const newUser: User = {
      _id: `user${Date.now()}`,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: 'player',
      credits: 1000,
      status: 'active'
    };
    
    mockUsers.push(newUser);
    
    const token = `mock-token-${newUser._id}`;
    localStorage.setItem('token', token);
    localStorage.setItem('poker_user', JSON.stringify({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      credits: newUser.credits,
      status: newUser.status
    }));
    
    return {
      success: true,
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        credits: newUser.credits,
        status: newUser.status
      }
    };
  },

  async verify() {
    await delay(200);
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('poker_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          success: true,
          user
        };
      } catch {
        return {
          success: false,
          message: 'Invalid token'
        };
      }
    }
    
    return {
      success: false,
      message: 'No token found'
    };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('poker_user');
  }
};

// Check if we should use mock API (when backend is not available)
export const shouldUseMockApi = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const useMockEnv = process.env.NEXT_PUBLIC_USE_MOCK_API;
  
  console.log('=== shouldUseMockApi Debug ===');
  console.log('NEXT_PUBLIC_API_URL:', apiUrl);
  console.log('NEXT_PUBLIC_USE_MOCK_API:', useMockEnv);
  
  // If backend URL is configured, use real API (unless explicitly disabled)
  if (apiUrl && apiUrl !== '' && useMockEnv !== 'true') {
    console.log('Backend URL configured, using real API');
    return false;
  }
  
  // Use mock API if explicitly enabled or no backend URL
  console.log('Using mock API');
  return true;
};