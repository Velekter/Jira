import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import Back from './Back';

const renderBack = (page: string) => {
  return render(
    <MemoryRouter>
      <Back page={page} />
    </MemoryRouter>
  );
};

describe('Back component', () => {
  test('renders back button with correct text', () => {
    renderBack('/account');
    
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  test('renders link with correct href', () => {
    renderBack('/account');
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/account');
  });

  test('applies correct CSS class', () => {
    renderBack('/account');
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('back-button');
  });

  test('works with different page paths', () => {
    renderBack('/dashboard');
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  test('works with root path', () => {
    renderBack('/');
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  test('works with nested paths', () => {
    renderBack('/account/settings');
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/account/settings');
  });
}); 