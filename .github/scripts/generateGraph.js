const {Octokit} = require("@octokit/rest");
const nodePath = require('node:path');
const fs = require('fs');
const octokit = new Octokit();
// https://github.com/IliaSolovev/changed_dependency_graph/pull/1

const pullRequestNumber = process.env.PULL_REQUEST_NUMBER;
const repoName = process.env.REPO_NAME;

const [owner, repo] = repoName.split('/')

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
                filesPathForGraph.add(normalize(getImportedFilePath(file.filename)))
            }
        })
    })
    console.log(filesPathForGraph)
    console.log(`madge --extensions ts --image graph.svg ${Array.from(filesPathForGraph).join(' ')}`)
});

function getImportedFilePath(mainFilePath) {
    const content = fs.readFileSync(mainFilePath, 'utf-8');
    const match = content.match(/import.*from\s*['"](.*)['"]/);

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
