---
description: Deep, iterative bug fixing and code quality assurance loop.
---

// turbo-all

# Deep Code Cleanse Workflow

This workflow instructs the agent to tirelessly analyze, fix, and verify code in a target directory until the highest quality standards are met.

1. **Target Identification**
   - Identify the target directory (default: `staticsjv2` if not specified).
   - Deeply analyze the file structure and existing code logic.

2. **Iterative Fix Loop**
   - **Analyze**: Perform a comprehensive review of the code for:
     - Deep logic errors (infinite loops, race conditions, state inconsistencies).
     - Security vulnerabilities (XSS, injection, prototype pollution).
     - Performance bottlenecks (memory leaks, inefficient loops).
     - Code style and maintainability issues.
   - **Plan**: List all identified issues in a prioritized manner.
   - **Execute Filter**: Focus on "highest quality" and "functionality".
   - **Execute**: Apply fixes to the code. 
   - **Verify**: 
     - Run any available tests using `npm test` or similar.
     - If no tests exist, create a temporary verification script or inspect manually.
     - Ensure no functionality is broken.
   - **Repeat**: If issues remain or new ones are introduced, repeat the loop. Do not stop until a pass reveals ZERO significant issues.

3. **Final Verification**
   - Perform one final deep scan.
   - Ensure the code is clean, robust, and functional.
   - Acknowledge completion only when confident.
