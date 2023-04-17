const pullRequestNumber = process.env.PULL_REQUEST_NUMBER;
const orgName = process.env.ORG_NAME;
const repoName = process.env.REPO_NAME;

console.log(`Pull request number: ${pullRequestNumber}`);
console.log(`Organization name: ${orgName}`);
console.log(`Repository name: ${repoName}`);
