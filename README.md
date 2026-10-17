# CloudGuard AI

CloudGuard AI is a frontend demo of an AI-assisted cloud security review workflow. It displays a sample infrastructure pull request, highlights a simulated AWS S3 security finding, and lets you try an approval or rejection flow.

## Demo features

- Sample pull request and Terraform change
- Example finding for a public S3 bucket (`AWS-S3-001`, `CWE-284`)
- Simulated scan log and estimated cost savings
- Approval and rejection controls

> **Demo only:** The pull request, scan results, and savings estimate are simulated. This app does not connect to GitHub or AWS, change cloud resources, or apply real fixes. Do not use it as a production security scanner.

## Run locally

### Requirements

- Node.js 24+
- pnpm

From the project root:

```bash
pnpm install

