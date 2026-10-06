import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the home screen', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'Rattler Resource Rescue System' })).toBeInTheDocument()
  expect(screen.getByText(/Find what you need/)).toBeInTheDocument()
  for (const link of ['Login', 'About', 'Help', 'Contact Us']) {
    expect(screen.getByRole('link', { name: link })).toBeInTheDocument()
  }
})
