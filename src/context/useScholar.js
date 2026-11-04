import { useContext } from 'react';
import { ScholarContext } from './ScholarContextBase';

export function useScholar() {
  const context = useContext(ScholarContext);
  if (!context) {
    throw new Error('useScholar must be used within a ScholarProvider');
  }
  return context;
}
