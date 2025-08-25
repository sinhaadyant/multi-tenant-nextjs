import React from 'react'
import { mount } from 'cypress/react18'
import TenantLogin from '../../src/components/auth/TenantLogin'

// Mock i18n for Cypress component tests
const mockI18n = {
  t: (key, options) => {
    const translations = {
      'auth:emailAddress': 'Email Address',
      'auth:password': 'Password',
      'auth:signIn': 'Sign In',
      'auth:rememberMe': 'Remember Me',
      'auth:forgotPassword': 'Forgot Password?',
      'errors:validation.required': 'This field is required',
      'errors:validation.email': 'Please enter a valid email address',
    }
    
    if (options && options.name) {
      return translations[key]?.replace('{{name}}', options.name) || key
    }
    
    return translations[key] || key
  },
  changeLanguage: () => Promise.resolve(),
  language: 'en'
}

// Mock react-i18next
beforeEach(() => {
  cy.window().then((win) => {
    win.React = React
    win.useTranslation = () => ({ t: mockI18n.t, i18n: mockI18n })
  })
})

describe('Login Component i18n Tests', () => {
  it('should display translated text in English', () => {
    cy.mount(<TenantLogin tenantSlug="test" onLoginSuccess={() => {}} isSubmitting={false} />)
    
    // Check that translated text appears
    cy.contains('Email Address').should('be.visible')
    cy.contains('Password').should('be.visible')
    cy.contains('Sign In').should('be.visible')
  })

  it('should show validation errors in correct language', () => {
    cy.mount(<TenantLogin tenantSlug="test" onLoginSuccess={() => {}} isSubmitting={false} />)
    
    // Try to submit without filling fields
    cy.get('button[type="submit"]').click()
    
    // Should show translated validation messages
    cy.contains('This field is required').should('be.visible')
  })

  it('should handle form interactions with translations', () => {
    cy.mount(<TenantLogin tenantSlug="test" onLoginSuccess={() => {}} isSubmitting={false} />)
    
    // Fill form with valid data
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    
    // Submit button should show translated text
    cy.get('button[type="submit"]').should('contain', 'Sign In')
  })

  it('should test language switching capability', () => {
    // Mock French translations
    const frenchMockI18n = {
      ...mockI18n,
      language: 'fr',
      t: (key) => {
        const frenchTranslations = {
          'auth:emailAddress': 'Adresse e-mail',
          'auth:password': 'Mot de passe',
          'auth:signIn': 'Se connecter',
        }
        return frenchTranslations[key] || key
      }
    }

    cy.window().then((win) => {
      win.useTranslation = () => ({ t: frenchMockI18n.t, i18n: frenchMockI18n })
    })

    cy.mount(<TenantLogin tenantSlug="test" onLoginSuccess={() => {}} isSubmitting={false} />)
    
    // Check that French text appears
    cy.contains('Adresse e-mail').should('be.visible')
    cy.contains('Mot de passe').should('be.visible')
    cy.contains('Se connecter').should('be.visible')
  })
})