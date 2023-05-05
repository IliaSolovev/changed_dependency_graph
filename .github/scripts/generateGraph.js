const {Octokit} = require("@octokit/rest");
const { exec } = require("child_process");
const {getChangedFileDependencies} = require("../../lib/getChangedFileDependencies");

// https://github.com/IliaSolovev/changed_dependency_graph/pull/1

const pullRequestNumber = process.env.PULL_REQUEST_NUMBER;
const repoName = process.env.REPO_NAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const [owner, repo] = repoName.split('/')
const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

console.log(`Pull request number: ${pullRequestNumber}`);
console.log(`Repository name: ${repoName}`);

octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullRequestNumber,
}).then(({data}) => {
    const command = `npx madge --extensions ts --image graph.svg ${Array.from(getChangedFileDependencies(data)).join(' ')}`
    console.log(command)
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
});

