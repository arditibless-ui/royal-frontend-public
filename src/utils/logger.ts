/**
 * Development-only logger utility
 * Wraps console methods to only log in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}

// For production errors that need to be logged
export const logError = (error: Error | string, context?: string) => {
  if (context) {
    console.error(`[${context}]`, error)
  } else {
    console.error(error)
  }
}
