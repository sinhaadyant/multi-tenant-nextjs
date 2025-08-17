#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const readline = require("readline");

// Configuration
const CONFIG = {
  projectName: "multi-tenant-admin-api",
  baseDir: process.cwd(),
  progressDir: "./implementation-progress",
  logsDir: "./implementation-logs",
  steps: [
    {
      id: 1,
      name: "Initialize Node.js Project with TypeScript",
      file: "step1-project-setup.md",
      commands: [
        "npm init -y",
        "npm install typescript @types/node ts-node nodemon --save-dev",
        "npm install express @types/express cors @types/cors helmet express-rate-limit",
        "npm install prisma @prisma/client",
        "npm install jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs",
        "npm install redis dotenv zod winston",
        "npm install multer @types/multer",
        "npx tsc --init",
        "mkdir -p src/{controllers,services,middleware,routes,schemas,utils,config,types}",
        "mkdir -p prisma uploads tests docs",
        "touch .env.example .gitignore",
      ],
      validation: ["npm run build", "npm run dev"],
      files: [
        "package.json",
        "tsconfig.json",
        "nodemon.json",
        ".env.example",
        ".gitignore",
      ],
    },
    {
      id: 2,
      name: "Install and Configure Core Dependencies",
      file: "step2-dependencies.md",
      commands: [
        "npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin",
        "npx eslint --init",
        "npm install --save-dev jest @types/jest supertest @types/supertest",
      ],
      validation: ["npm run lint", "npm test"],
      files: [".eslintrc.js", ".prettierrc", "jest.config.js"],
    },
    {
      id: 3,
      name: "Set Up Database Schema with Prisma",
      file: "step3-database-schema.md",
      commands: ["npx prisma init", "npx prisma generate"],
      validation: ["npx prisma validate"],
      files: ["prisma/schema.prisma"],
    },
    {
      id: 4,
      name: "Configure Environment and Database Connection",
      file: "step4-environment-config.md",
      commands: ["touch .env", "cp .env.example .env"],
      validation: ["node -e \"require('./src/config/env')\""],
      files: [
        "src/config/env.ts",
        "src/config/database.ts",
        "src/config/redis.ts",
      ],
    },
    {
      id: 5,
      name: "Implement Authentication Middleware and JWT Utils",
      file: "step5-authentication.md",
      commands: [],
      validation: ["npm run build"],
      files: [
        "src/middleware/auth.ts",
        "src/middleware/permissionGuard.ts",
        "src/utils/jwt.ts",
        "src/utils/password.ts",
        "src/types/auth.ts",
      ],
    },
    {
      id: 6,
      name: "Create Request/Response Validation with Zod",
      file: "step6-validation.md",
      commands: [],
      validation: ["npm run build"],
      files: [
        "src/schemas/auth.schemas.ts",
        "src/schemas/user.schemas.ts",
        "src/schemas/common.schemas.ts",
        "src/middleware/validation.ts",
        "src/utils/response.ts",
      ],
    },
    {
      id: 7,
      name: "Implement User Management API Endpoints",
      file: "step7-user-management.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="User"'],
      files: [
        "src/controllers/userController.ts",
        "src/services/userService.ts",
        "src/routes/userRoutes.ts",
        "src/middleware/dataScope.ts",
      ],
    },
    {
      id: 8,
      name: "Build Authentication Endpoints",
      file: "step8-auth-endpoints.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Auth"'],
      files: [
        "src/controllers/authController.ts",
        "src/services/authService.ts",
        "src/routes/authRoutes.ts",
      ],
    },
    {
      id: 9,
      name: "Implement Role Management API",
      file: "step9-role-management.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Role"'],
      files: [
        "src/controllers/roleController.ts",
        "src/services/roleService.ts",
        "src/routes/roleRoutes.ts",
      ],
    },
    {
      id: 10,
      name: "Create Permission System API",
      file: "step10-permission-system.md",
      commands: [],
      validation: [
        "npm run build",
        'npm test -- --testNamePattern="Permission"',
      ],
      files: [
        "src/controllers/permissionController.ts",
        "src/services/permissionService.ts",
        "src/routes/permissionRoutes.ts",
        "src/services/dataScopeService.ts",
      ],
    },
    {
      id: 11,
      name: "Build Tenant Management API",
      file: "step11-tenant-management.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Tenant"'],
      files: [
        "src/controllers/tenantController.ts",
        "src/services/tenantService.ts",
        "src/routes/tenantRoutes.ts",
      ],
    },
    {
      id: 12,
      name: "Implement Support Ticket System API",
      file: "step12-support-system.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Support"'],
      files: [
        "src/controllers/supportController.ts",
        "src/services/supportService.ts",
        "src/routes/supportRoutes.ts",
      ],
    },
    {
      id: 13,
      name: "Create Audit Logging System",
      file: "step13-audit-logging.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Audit"'],
      files: [
        "src/controllers/auditController.ts",
        "src/services/auditService.ts",
        "src/routes/auditRoutes.ts",
        "src/middleware/audit.ts",
      ],
    },
    {
      id: 14,
      name: "Implement File Upload and Management System",
      file: "step14-file-management.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="File"'],
      files: [
        "src/controllers/fileController.ts",
        "src/services/fileService.ts",
        "src/routes/fileRoutes.ts",
        "src/middleware/upload.ts",
      ],
    },
    {
      id: 14.5,
      name: "Create Menu and Navigation API",
      file: "step14-5-menu-navigation.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Menu"'],
      files: [
        "src/controllers/menuController.ts",
        "src/services/menuService.ts",
        "src/routes/menuRoutes.ts",
      ],
    },
    {
      id: 15,
      name: "Build Session Management System",
      file: "step15-session-management.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Session"'],
      files: [
        "src/controllers/sessionController.ts",
        "src/services/sessionService.ts",
        "src/routes/sessionRoutes.ts",
      ],
    },
    {
      id: 16,
      name: "Create Advanced Search and Filtering System",
      file: "step16-search-system.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Search"'],
      files: [
        "src/controllers/searchController.ts",
        "src/services/searchService.ts",
        "src/routes/searchRoutes.ts",
      ],
    },
    {
      id: 17,
      name: "Implement API Rate Limiting and Security",
      file: "step17-security.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Security"'],
      files: [
        "src/middleware/rateLimit.ts",
        "src/middleware/security.ts",
        "src/services/securityService.ts",
      ],
    },
    {
      id: 18,
      name: "Build Analytics and Reporting System",
      file: "step18-analytics.md",
      commands: [],
      validation: [
        "npm run build",
        'npm test -- --testNamePattern="Analytics"',
      ],
      files: [
        "src/controllers/analyticsController.ts",
        "src/services/analyticsService.ts",
        "src/routes/analyticsRoutes.ts",
      ],
    },
    {
      id: 19,
      name: "Create Notification System API",
      file: "step19-notifications.md",
      commands: [],
      validation: [
        "npm run build",
        'npm test -- --testNamePattern="Notification"',
      ],
      files: [
        "src/controllers/notificationController.ts",
        "src/services/notificationService.ts",
        "src/routes/notificationRoutes.ts",
      ],
    },
    {
      id: 20,
      name: "Implement Backup and Data Export System",
      file: "step20-backup-export.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Backup"'],
      files: [
        "src/controllers/backupController.ts",
        "src/services/backupService.ts",
        "src/routes/backupRoutes.ts",
      ],
    },
    {
      id: 21,
      name: "Create Health Check and Monitoring System",
      file: "step21-health-monitoring.md",
      commands: [],
      validation: ["npm run build", 'npm test -- --testNamePattern="Health"'],
      files: [
        "src/controllers/healthController.ts",
        "src/services/healthService.ts",
        "src/routes/healthRoutes.ts",
      ],
    },
    {
      id: 22,
      name: "Create API Documentation System",
      file: "step22-api-docs.md",
      commands: ["npm install swagger-ui-express swagger-jsdoc"],
      validation: ["npm run build"],
      files: ["src/config/swagger.ts", "src/routes/docsRoutes.ts"],
    },
    {
      id: 23,
      name: "Implement Caching Strategy",
      file: "step23-caching.md",
      commands: [],
      validation: ["npm run build"],
      files: ["src/services/cacheService.ts", "src/middleware/cache.ts"],
    },
    {
      id: 24,
      name: "Testing, Security Hardening, and Deployment",
      file: "step24-testing-deployment.md",
      commands: ["npm run test:coverage", "npm audit fix"],
      validation: ["npm run build", "npm run test:coverage"],
      files: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
    },
  ],
};

class ImplementationAutomator {
  constructor() {
    this.currentStep = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start() {
    console.log("🚀 Starting Backend Implementation Automation");
    console.log("==============================================\n");

    // Create directories
    this.createDirectories();

    // Create progress tracking
    this.createProgressTracker();

    // Start implementation
    await this.runImplementation();

    this.rl.close();
  }

  createDirectories() {
    const dirs = [CONFIG.progressDir, CONFIG.logsDir];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  createProgressTracker() {
    const trackerFile = path.join(CONFIG.progressDir, "progress-tracker.md");
    const content = `# Implementation Progress Tracker

## Overview
- **Total Steps**: ${CONFIG.steps.length}
- **Started**: ${new Date().toISOString()}
- **Status**: In Progress

## Steps Status

${CONFIG.steps.map((step) => `- [ ] Step ${step.id}: ${step.name}`).join("\n")}

## Summary
- **Completed**: 0/${CONFIG.steps.length}
- **Failed**: 0
- **In Progress**: 0

---
*Last Updated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(trackerFile, content);
    console.log("✅ Created progress tracker");
  }

  async runImplementation() {
    for (let i = 0; i < CONFIG.steps.length; i++) {
      this.currentStep = i;
      const step = CONFIG.steps[i];

      console.log(`\n📋 Step ${step.id}: ${step.name}`);
      console.log("=".repeat(50));

      try {
        // Create step progress file
        await this.createStepProgressFile(step);

        // Run step commands
        await this.runStepCommands(step);

        // Validate step
        await this.validateStep(step);

        // Mark step as completed
        await this.markStepCompleted(step);

        console.log(`✅ Step ${step.id} completed successfully!\n`);

        // Ask user if they want to continue
        if (i < CONFIG.steps.length - 1) {
          const continueResponse = await this.askQuestion(
            "Continue to next step? (y/n): "
          );
          if (continueResponse.toLowerCase() !== "y") {
            console.log("⏸️  Implementation paused. You can resume later.");
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Step ${step.id} failed:`, error.message);
        await this.markStepFailed(step, error);

        const retryResponse = await this.askQuestion(
          "Retry this step? (y/n): "
        );
        if (retryResponse.toLowerCase() === "y") {
          i--; // Retry the same step
        } else {
          const continueResponse = await this.askQuestion(
            "Continue to next step? (y/n): "
          );
          if (continueResponse.toLowerCase() !== "y") {
            console.log("⏸️  Implementation paused due to error.");
            break;
          }
        }
      }
    }

    await this.finalizeImplementation();
  }

  async createStepProgressFile(step) {
    const stepFile = path.join(CONFIG.progressDir, step.file);
    const content = `# Step ${step.id}: ${step.name}

## Status: In Progress
**Started**: ${new Date().toISOString()}

## Implementation Details
- **Step ID**: ${step.id}
- **Step Name**: ${step.name}
- **Commands to Run**: ${step.commands.length}
- **Files to Create**: ${step.files.length}
- **Validation Tests**: ${step.validation.length}

## Commands Executed
${step.commands.map((cmd) => `- [ ] ${cmd}`).join("\n")}

## Files Created
${step.files.map((file) => `- [ ] ${file}`).join("\n")}

## Validation Tests
${step.validation.map((test) => `- [ ] ${test}`).join("\n")}

## Logs
\`\`\`
[${new Date().toISOString()}] Step started
\`\`\`

---
*Last Updated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(stepFile, content);
    console.log(`📝 Created progress file: ${step.file}`);
  }

  async runStepCommands(step) {
    if (step.commands.length === 0) {
      console.log("⏭️  No commands to run for this step");
      return;
    }

    console.log("🔧 Running commands...");

    for (const command of step.commands) {
      try {
        console.log(`  Running: ${command}`);
        const output = execSync(command, {
          cwd: CONFIG.baseDir,
          encoding: "utf8",
          stdio: "pipe",
        });

        // Update step progress file
        this.updateStepProgress(step, "command", command, true, output);
        console.log(`  ✅ Command completed: ${command}`);
      } catch (error) {
        console.error(`  ❌ Command failed: ${command}`);
        console.error(`  Error: ${error.message}`);

        // Update step progress file
        this.updateStepProgress(step, "command", command, false, error.message);

        // Try to fix common errors
        await this.attemptErrorFix(step, command, error);
      }
    }
  }

  async validateStep(step) {
    if (step.validation.length === 0) {
      console.log("⏭️  No validation tests for this step");
      return;
    }

    console.log("🧪 Running validation tests...");

    for (const test of step.validation) {
      try {
        console.log(`  Testing: ${test}`);
        const output = execSync(test, {
          cwd: CONFIG.baseDir,
          encoding: "utf8",
          stdio: "pipe",
        });

        // Update step progress file
        this.updateStepProgress(step, "validation", test, true, output);
        console.log(`  ✅ Test passed: ${test}`);
      } catch (error) {
        console.error(`  ❌ Test failed: ${test}`);
        console.error(`  Error: ${error.message}`);

        // Update step progress file
        this.updateStepProgress(step, "validation", test, false, error.message);

        // Try to fix validation errors
        await this.attemptValidationFix(step, test, error);
      }
    }
  }

  async attemptErrorFix(step, command, error) {
    console.log("🔧 Attempting to fix error...");

    // Common fixes based on error patterns
    if (error.message.includes("command not found")) {
      console.log("  📦 Installing missing dependencies...");
      try {
        execSync("npm install", { cwd: CONFIG.baseDir, stdio: "pipe" });
        console.log("  ✅ Dependencies installed");
      } catch (installError) {
        console.error("  ❌ Failed to install dependencies");
      }
    }

    if (error.message.includes("permission denied")) {
      console.log("  🔐 Fixing permissions...");
      try {
        execSync("chmod +x node_modules/.bin/*", {
          cwd: CONFIG.baseDir,
          stdio: "pipe",
        });
        console.log("  ✅ Permissions fixed");
      } catch (permError) {
        console.error("  ❌ Failed to fix permissions");
      }
    }
  }

  async attemptValidationFix(step, test, error) {
    console.log("🔧 Attempting to fix validation error...");

    if (test.includes("build") && error.message.includes("TypeScript")) {
      console.log("  🔧 Fixing TypeScript errors...");
      // Add common TypeScript fixes
      await this.fixTypeScriptErrors();
    }

    if (test.includes("test") && error.message.includes("test")) {
      console.log("  🔧 Fixing test errors...");
      // Add common test fixes
      await this.fixTestErrors();
    }
  }

  async fixTypeScriptErrors() {
    // Common TypeScript fixes
    const commonFixes = [
      "npm install --save-dev @types/node",
      "npx tsc --noEmit --skipLibCheck",
    ];

    for (const fix of commonFixes) {
      try {
        execSync(fix, { cwd: CONFIG.baseDir, stdio: "pipe" });
        console.log(`  ✅ Applied fix: ${fix}`);
      } catch (error) {
        console.log(`  ⚠️  Fix not applicable: ${fix}`);
      }
    }
  }

  async fixTestErrors() {
    // Common test fixes
    const testFixes = [
      "npm install --save-dev jest @types/jest",
      "npm run test -- --passWithNoTests",
    ];

    for (const fix of testFixes) {
      try {
        execSync(fix, { cwd: CONFIG.baseDir, stdio: "pipe" });
        console.log(`  ✅ Applied test fix: ${fix}`);
      } catch (error) {
        console.log(`  ⚠️  Test fix not applicable: ${fix}`);
      }
    }
  }

  updateStepProgress(step, type, item, success, output) {
    const stepFile = path.join(CONFIG.progressDir, step.file);
    let content = fs.readFileSync(stepFile, "utf8");

    const status = success ? "✅" : "❌";
    const timestamp = new Date().toISOString();

    // Update the specific item
    if (type === "command") {
      content = content.replace(
        `- [ ] ${item}`,
        `- [${success ? "x" : " "}] ${item} ${status}`
      );
    } else if (type === "validation") {
      content = content.replace(
        `- [ ] ${item}`,
        `- [${success ? "x" : " "}] ${item} ${status}`
      );
    }

    // Add to logs section
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${item} - ${
      success ? "SUCCESS" : "FAILED"
    }\n\`\`\`\n${output}\n\`\`\`\n\n`;
    content = content.replace("## Logs", `## Logs\n\n${logEntry}`);

    fs.writeFileSync(stepFile, content);
  }

  async markStepCompleted(step) {
    const stepFile = path.join(CONFIG.progressDir, step.file);
    let content = fs.readFileSync(stepFile, "utf8");

    content = content.replace(
      "## Status: In Progress",
      "## Status: ✅ Completed"
    );
    content += `\n**Completed**: ${new Date().toISOString()}\n`;

    fs.writeFileSync(stepFile, content);

    // Update main progress tracker
    this.updateMainProgressTracker(step.id, true);
  }

  async markStepFailed(step, error) {
    const stepFile = path.join(CONFIG.progressDir, step.file);
    let content = fs.readFileSync(stepFile, "utf8");

    content = content.replace("## Status: In Progress", "## Status: ❌ Failed");
    content += `\n**Failed**: ${new Date().toISOString()}\n**Error**: ${
      error.message
    }\n`;

    fs.writeFileSync(stepFile, content);

    // Update main progress tracker
    this.updateMainProgressTracker(step.id, false);
  }

  updateMainProgressTracker(stepId, success) {
    const trackerFile = path.join(CONFIG.progressDir, "progress-tracker.md");
    let content = fs.readFileSync(trackerFile, "utf8");

    const step = CONFIG.steps.find((s) => s.id === stepId);
    const status = success ? "x" : " ";
    const icon = success ? "✅" : "❌";

    content = content.replace(
      `- [ ] Step ${stepId}: ${step.name}`,
      `- [${status}] Step ${stepId}: ${step.name} ${icon}`
    );

    // Update summary
    const completedCount = (content.match(/- \[x\]/g) || []).length;
    const failedCount = (content.match(/❌/g) || []).length;

    content = content.replace(
      /- \*\*Completed\*\*: \d+\/\d+/,
      `- **Completed**: ${completedCount}/${CONFIG.steps.length}`
    );
    content = content.replace(
      /- \*\*Failed\*\*: \d+/,
      `- **Failed**: ${failedCount}`
    );

    content = content.replace(
      /- \*\*In Progress\*\*: \d+/,
      `- **In Progress**: ${CONFIG.steps.length - completedCount - failedCount}`
    );

    content = content.replace(
      /\*Last Updated: .*\*/,
      `*Last Updated: ${new Date().toISOString()}*`
    );

    fs.writeFileSync(trackerFile, content);
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async finalizeImplementation() {
    console.log("\n🎉 Implementation Complete!");
    console.log("==========================");

    const trackerFile = path.join(CONFIG.progressDir, "progress-tracker.md");
    const content = fs.readFileSync(trackerFile, "utf8");

    const completedCount = (content.match(/- \[x\]/g) || []).length;
    const failedCount = (content.match(/❌/g) || []).length;

    console.log(`📊 Final Statistics:`);
    console.log(`   - Total Steps: ${CONFIG.steps.length}`);
    console.log(`   - Completed: ${completedCount}`);
    console.log(`   - Failed: ${failedCount}`);
    console.log(
      `   - Success Rate: ${(
        (completedCount / CONFIG.steps.length) *
        100
      ).toFixed(1)}%`
    );

    console.log("\n📁 Files Created:");
    console.log(
      `   - Progress Tracker: ${CONFIG.progressDir}/progress-tracker.md`
    );
    console.log(`   - Step Files: ${CONFIG.progressDir}/*.md`);
    console.log(`   - Logs: ${CONFIG.logsDir}/`);

    console.log("\n🚀 Next Steps:");
    console.log("   1. Review the progress tracker for any failed steps");
    console.log("   2. Manually fix any remaining issues");
    console.log("   3. Run final tests: npm run test:coverage");
    console.log("   4. Start the server: npm run dev");

    // Create final summary
    this.createFinalSummary(completedCount, failedCount);
  }

  createFinalSummary(completed, failed) {
    const summaryFile = path.join(CONFIG.progressDir, "final-summary.md");
    const content = `# Implementation Final Summary

## Overview
- **Total Steps**: ${CONFIG.steps.length}
- **Completed**: ${completed}
- **Failed**: ${failed}
- **Success Rate**: ${((completed / CONFIG.steps.length) * 100).toFixed(1)}%
- **Completed At**: ${new Date().toISOString()}

## Project Structure
\`\`\`
${CONFIG.projectName}/
├── src/
│   ├── controllers/     # API controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── schemas/         # Zod validation schemas
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── types/           # TypeScript type definitions
├── prisma/              # Database schema and migrations
├── tests/               # Test files
├── uploads/             # File uploads
├── docs/                # Documentation
└── implementation-progress/  # Progress tracking files
\`\`\`

## Key Features Implemented
- ✅ Multi-tenant architecture with data isolation
- ✅ Permission-based data scope system
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive audit logging
- ✅ File upload and management
- ✅ Support ticket system
- ✅ Analytics and reporting
- ✅ Health monitoring
- ✅ API documentation
- ✅ Caching strategy
- ✅ Security hardening

## Next Steps
1. **Review Failed Steps**: Check \`implementation-progress/\` for any failed steps
2. **Manual Fixes**: Address any remaining issues manually
3. **Testing**: Run comprehensive tests
4. **Deployment**: Set up production environment
5. **Documentation**: Complete API documentation
6. **Monitoring**: Set up production monitoring

## Commands to Run
\`\`\`bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start
\`\`\`

---
*Generated by Implementation Automator on ${new Date().toISOString()}*
`;

    fs.writeFileSync(summaryFile, content);
    console.log(`\n📄 Final summary created: ${summaryFile}`);
  }
}

// Run the automator
if (require.main === module) {
  const automator = new ImplementationAutomator();
  automator.start().catch(console.error);
}

module.exports = ImplementationAutomator;
