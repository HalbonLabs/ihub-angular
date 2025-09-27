/**
 * Nx Cloud configuration
 * 
 * This file configures Nx Cloud for remote caching and task distribution.
 * 
 * To get started:
 * 1. Create an account at https://cloud.nx.app
 * 2. Replace YOUR_ACCESS_TOKEN_HERE with your actual access token
 * 3. Push your repository to GitHub/GitLab/Bitbucket
 * 4. Connect your repository to Nx Cloud
 */

module.exports = {
  // Enable remote caching
  enableRemoteCache: true,
  
  // Configure task distribution
  distributedTaskExecution: true,
  
  // Configure agents for task distribution
  agents: [
    {
      name: 'linux-medium-js',
      count: 3
    }
  ],
  
  // Configure caching settings
  cacheableOperations: ['build', 'test', 'lint', 'e2e'],
  
  // Configure which files to include in the cache
  implicitDependencies: {
    'package.json': ['*'],
    'tsconfig.base.json': ['*'],
    'nx.json': ['*'],
    '.eslintrc.json': ['*']
  }
};