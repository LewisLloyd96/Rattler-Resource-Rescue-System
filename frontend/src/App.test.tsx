import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the splash screen', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Campus Resource Rescue System' })).toBeInTheDocument()
  expect(screen.getByText('Share it. Reuse it. Rescue it.')).toBeInTheDocument()
  for (const link of ['Login', 'About', 'Help', 'Contact Us']) {
    expect(screen.getByRole('link', { name: link })).toBeInTheDocument()
  }
})
