import { execSync } from "child_process";

const testFiles = [
  "tests/live-integration.test.ts",
  "tests/api-identity-security.test.ts",
  "tests/module02-segregation.test.ts",
  "tests/segregation-benchmark.test.ts",
  "tests/operations-foundation.test.ts",
  "tests/operations-algorithms.test.ts",
  "tests/operations-api.test.ts",
  "tests/operations-ui-workflows.test.ts",
  "tests/analytics-decision-support.test.ts",
  "tests/analytics-foundation.test.ts",
  "tests/analytics-api.test.ts",
  "tests/analytics-security.test.ts",
  "tests/civic-foundation.test.ts",
  "tests/civic-e2e.test.ts",
  "tests/civic-cleanup-foundation.test.ts",
  "tests/civic-cleanup-api.test.ts",
  "tests/civic-cleanup-ui-workflows.test.ts",
  "tests/final-acceptance-workflows.test.ts",
];

console.log("==========================================================");
console.log("  ECOWATCH AI — FULL REGRESSION TEST RUNNER              ");
console.log("==========================================================\n");

let passedSuites = 0;
let failedSuites = 0;
let grandTotalTests = 0;

for (const testFile of testFiles) {
  process.stdout.write(`Executing ${testFile.padEnd(45)}: `);
  try {
    const output = execSync(`npx --no-install tsx ${testFile}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    
    // Parse test count from output
    const match = output.match(/PASSED:\s*(\d+)/i) || 
                  output.match(/TOTAL (?:API |WORKFLOW )?TESTS:\s*(\d+)/i) ||
                  output.match(/(\d+)\s*passed/i);
    
    let suiteTests = 0;
    if (match) {
      suiteTests = parseInt(match[1], 10);
      grandTotalTests += suiteTests;
      console.log(`PASSED (${suiteTests} tests)`);
    } else {
      console.log("PASSED");
    }
    
    passedSuites++;
  } catch (err: any) {
    console.log("FAILED");
    console.error(err.stdout || err.stderr || err.message);
    failedSuites++;
  }
}

console.log("\n==========================================================");
console.log(`TOTAL SUITES:  ${testFiles.length} (${passedSuites} Passed, ${failedSuites} Failed)`);
console.log(`TOTAL TESTS:   ${grandTotalTests} Passed across all suites`);
console.log("==========================================================");

if (failedSuites > 0) {
  process.exit(1);
}
