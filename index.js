const {Octokit} = require("@octokit/rest");
const nodePath = require('node:path');
const fs = require('fs');
const octokit = new Octokit();
// https://github.com/IliaSolovev/changed_dependency_graph/pull/1

const root = 'src'
const fileExtensions = ['.ts', '.tsx']

octokit.rest.pulls.listFiles({
    owner: 'IliaSolovev',
    repo: 'changed_dependency_graph',
    pull_number: '1',
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
                filesPathForGraph.add(normalize(getImportedFilePath(file.filename) + '.ts'))
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
        return nodePath.join(nodePath.dirname(mainFilePath), importedPath);
    }
    return null;
}

const normalize = (path) => path.replace(/\\/g, '/')
