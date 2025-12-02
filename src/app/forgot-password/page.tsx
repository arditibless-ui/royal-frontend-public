'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password reset link has been sent to your email');
        setEmail('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.message || 'Failed to send password reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 sm:px-8 sm:py-10 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🔐</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Forgot Password
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="text-green-800 font-medium mb-1">Email Sent!</p>
                    <p className="text-green-700 text-sm">{message}</p>
                    <p className="text-green-600 text-xs mt-2">
                      Redirecting to login...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">❌</span>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !!message}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                />
                <p className="mt-2 text-xs text-gray-500">
                  We'll send a password reset link to this email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !!message}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-xl mr-2">💡</span>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Enter your registered email address</li>
                    <li>Check your inbox for the reset link</li>
                    <li>Click the link within 1 hour</li>
                    <li>Create your new password</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link 
                href="/"
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center group"
              >
                <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-white/80 text-sm px-4">
          <p>Having trouble? Contact support at</p>
          <a href="mailto:support@texasholdem.com" className="text-yellow-300 hover:text-yellow-200 font-medium">
            support@texasholdem.com
          </a>
        </div>
      </div>

      {/* Responsive styles for landscape mobile */}
      <style jsx>{`
        @media (max-width: 768px) and (orientation: landscape) {
          .min-h-screen {
            min-height: 100vh;
            padding: 1rem 0;
          }
          
          .max-w-md {
            max-width: 90%;
          }
          
          .px-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .py-8 {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }
          
          .text-5xl {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .sm\\:px-8 {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
          
          .sm\\:py-10 {
            padding-top: 2rem;
            padding-bottom: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
