const {Octokit} = require("@octokit/rest");
const nodePath = require('node:path');
const fs = require('fs');
const { exec } = require("child_process");

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

const fileExtensions = ['.ts', '.tsx']

octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullRequestNumber,
}).then(({data}) => {
    const filesWithNecessaryExtensions = data.filter(({filename}) => fileExtensions.some((extension) => filename.endsWith(extension)))
    const filesPathForGraph = new Set();
    filesWithNecessaryExtensions.forEach((file) => {
        if (file.status === 'removed') return;

        filesPathForGraph.add(file.filename)
        // find added files in PR
        file.patch.split('\n').forEach((line) => {
            // example
            // +import { useAgent } from 'hooks';",
            if (line.startsWith('+import')) {
                filesPathForGraph.add(normalize(getImportedFilePath(file.filename, line)))
            }
        })
    })
    const command = `madge --extensions ts --image graph.svg ${Array.from(filesPathForGraph).join(' ')}`
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

function getImportedFilePath(mainFilePath, lineWithImport) {
    const match = lineWithImport.match(/import.*from\s*['"](.*)['"]/);

    if (match) {
        const importedPath = match[1];
        const fileDirname = nodePath.dirname(nodePath.join(nodePath.dirname(mainFilePath), importedPath))

        return readFileFromDir(fileDirname, removeRelativeSegments(importedPath))
    }
    return null;
}

const normalize = (path) => path.replace(/\\/g, '/')

function readFileFromDir(dirName, filePattern) {
    const files = fs.readdirSync(dirName);
    const matchedFile = files.find(file => {
        const filePath = nodePath.join(dirName, file);
        const isFile = fs.statSync(filePath).isFile();
        const matchesPattern = file.match(filePattern);
        return isFile && matchesPattern;
    });
    return nodePath.join(dirName, matchedFile);
}

function removeRelativeSegments(filePath) {
    return filePath.replace(/(\.|\/)\//g, '');
}
