const {Octokit} = require("@octokit/rest");
const {getChangedFileDependencies} = require('./lib/getChangedFileDependencies.js');
const { exec } = require("child_process");
const octokit = new Octokit();
// https://github.com/IliaSolovev/changed_dependency_graph/pull/1

octokit.rest.pulls.listFiles({
    owner: 'IliaSolovev',
    repo: 'changed_dependency_graph',
    pull_number: '2',
} ).then(({data}) => {
    const command = `madge --extensions ts --image graph.svg ${Array.from(getChangedFileDependencies(data)).join(' ')}`
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

