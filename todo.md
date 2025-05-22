# Linear MCP Server Improvements

## High Priority

### Type Safety Improvements
- [x] Add type assertions for GraphQL responses in issue handler (tested)
- [x] Replace remaining 'any' types with proper interfaces, particularly in:
  - [x] GraphQL client input parameters (tested)
  - [x] Execute method generic constraints (tested)
  - [x] Project and team operations (tested)
  - [x] Batch issue creation operations (tested)
- [ ] Create input validation schemas for all operations
- [x] Add proper return types for GraphQL responses in issue operations (tested)
- [x] Add proper return types for batch operations (tested)
- [ ] Implement runtime type checking

### Architecture Improvements
- [x] Refactor project creation to use atomic operations:
  - [x] Split createProjectWithIssues into atomic methods (tested)
  - [x] Implement proper batch issue creation (tested)
  - [x] Add comprehensive error handling for each step (tested)
  - [x] Update documentation to reflect new patterns

### Performance Optimization
- [x] Implement true batch mutations for bulk operations:
  - [x] Replace Promise.all with single GraphQL mutation for createIssues (tested)
  - [x] Replace Promise.all with single GraphQL mutation for updateIssues (tested)
  - [x] Replace Promise.all with single GraphQL mutation for deleteIssues (tested)
  - [x] Implement proper batch issue creation for projects (tested)
- [ ] Pre-import and cache GraphQL operations instead of dynamic imports
- [ ] Implement query batching for related operations
- [x] Add proper error handling for GraphQL errors (tested)

## Medium Priority

### Authentication Refactoring
- [ ] Split LinearAuth into separate classes:
  - [ ] Create ILinearAuth interface
  - [ ] Implement OAuthLinearAuth class
  - [ ] Implement APILinearAuth class
- [ ] Move OAuth-specific logic to OAuthLinearAuth
- [ ] Simplify APILinearAuth implementation

### Caching Implementation
- [ ] Add caching layer for frequently accessed data:
  - [ ] Team information
  - [ ] Project data
  - [ ] User data
- [ ] Implement cache invalidation strategy
- [ ] Add memory cache for short-lived data

### Rate Limiting
- [ ] Implement rate limiting middleware
- [ ] Add retry logic for rate limited requests
- [ ] Implement backoff strategy for failed requests
- [ ] Add rate limit monitoring

## Low Priority

### Error Handling Improvements
- [ ] Create domain-specific error types
- [ ] Add proper error logging
- [ ] Implement retry strategies for transient failures
- [ ] Improve error messages and debugging information

### OAuth Implementation Completion
- [ ] Implement proper token refresh flow
- [ ] Add state parameter validation
- [ ] Add token storage strategy
- [ ] Improve OAuth error handling

### Input Validation
- [ ] Implement JSON schema validation for all inputs
- [ ] Add custom validation rules for domain-specific logic
- [ ] Improve validation error messages
- [ ] Add input sanitization where needed

### Handler Architecture Improvements
- [ ] Move common validation logic to base handler
- [ ] Create domain-specific error types
- [ ] Implement proper dependency injection
- [ ] Add handler lifecycle hooks

## Technical Debt

### Documentation
- [ ] Add JSDoc comments for all public methods
- [ ] Create API documentation
- [ ] Add examples for common operations
- [ ] Document error handling strategies
- [x] Implement comment functionality

### Testing
- [x] Add unit tests for new type definitions
- [x] Create integration tests for bulk operations
- [ ] Add performance benchmarks
- [x] Implement test coverage requirements

### Code Quality
- [x] Add ESLint rules for type safety
- [x] Implement automated code formatting
- [ ] Add complexity limits
- [ ] Create contribution guidelines

### Completed Improvements
- [x] Fixed Jest configuration for ESM modules
- [x] Improved test organization with dedicated config directory
- [x] Enhanced LinearClient mock implementation
- [x] Fixed updateIssues implementation in GraphQL client
- [x] Improved type safety in GraphQL response handling
- [x] Enhanced error handling in GraphQL client
