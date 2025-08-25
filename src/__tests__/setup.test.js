/**
 * Basic setup test to verify Jest configuration
 */

describe('Test Setup', () => {
  it('should run basic Jest test', () => {
    expect(true).toBe(true);
  });

  it('should have access to global test utilities', () => {
    expect(global.createTestUser).toBeDefined();
    expect(global.createTestTenant).toBeDefined();
  });

  it('should mock localStorage', () => {
    global.localStorage.setItem('test', 'value');
    expect(global.localStorage.getItem('test')).toBe('value');
  });

  it('should have custom matchers available', () => {
    expect('test@example.com').toBeValidEmail();
    expect('invalid-email').not.toBeValidEmail();
  });
});
