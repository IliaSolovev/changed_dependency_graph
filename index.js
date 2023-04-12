const {Octokit} = require("@octokit/rest");
const nodePath = require('node:path');

const octokit = new Octokit();
const root = 'src'
const fileExtensions = ['.ts', '.tsx']

octokit.rest.pulls.listFiles({
    owner: 'Drill4J',
    repo: 'admin-ui',
    pull_number: '674',
}).then(({data}) => {
    const filesWithNecessaryExtensions = data.filter(({filename}) => fileExtensions.some((extension) => filename.endsWith(extension)))
    const filesPathForGraph = []
    filesWithNecessaryExtensions.forEach((file) => {
        if (file.status === 'removed') return;

        filesPathForGraph.push(file.filename)
        // find added files in PR
        file.patch.split('\n').forEach((line) => {
            // example
            // +import { useAgent } from 'hooks';",
            if (line.startsWith('+import')) {
                if (line.includes('\'')) {
                    const start = line.indexOf('\'') + 1;
                    const end = line.lastIndexOf('\'')
                    filesPathForGraph.push(getFilePath(file.filename, line.slice(start, end)))
                } else {
                    const start = line.indexOf('\"') + 1;
                    const end = line.lastIndexOf('\"')
                    filesPathForGraph.push(getFilePath(file.filename, line.slice(start, end)))
                }
            }
        })
    })
    console.log(filesPathForGraph)
});
// https://github.com/Drill4J/admin-ui/pull/674/files

const getFilePath = (parsingFilePath, path) => {
    if (path.startsWith('.')) {
        return nodePath.join(parsingFilePath, path)
    }
    return `${root}/${path}`
}
