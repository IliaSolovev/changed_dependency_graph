import nodePath from 'path'
const fs = require('fs')
import dependencyTree from '../../node-dependency-tree'
const fileExtensions = ['.ts', '.tsx']

interface IFile {
    filename: string
    status: string
    patch: string
}

const getChangedFileDependencies = (files: IFile[]) => {
    const filesWithNecessaryExtensions = files.filter(({filename}) => fileExtensions.some((extension) => filename.endsWith(extension)))

    const filesPathForGraph = new Set();
    filesWithNecessaryExtensions.forEach((file) => {
        if (file.status === 'removed') return;

        filesPathForGraph.add(file.filename)
        const res = dependencyTree({
            filename: file.filename,
            directory: nodePath.dirname(file.filename)
        });
        console.log(res, 'using depTree')
        // find added files in PR
        file.patch.split('\n').forEach((line) => {
            // example
            // +import { useAgent } from 'hooks';",
            if (line.startsWith('+import')) {
                const importFilepath = getImportedFilePath(file.filename, line)
                if(importFilepath) {
                    filesPathForGraph.add(normalize(importFilepath))
                }
            }
        })
    })
    return Array.from(filesPathForGraph)
}

function getImportedFilePath(mainFilePath, lineWithImport) {
    const match = lineWithImport.match(/import.*from\s*['"](.*)['"]/);

    if (match) {
        const importedPath = match[1];
        const fileDirname = nodePath.dirname(nodePath.join(nodePath.dirname(mainFilePath), importedPath))

        return readFileFromDir(fileDirname, removeRelativeSegments(importedPath))
    }
    return null;
}

const normalize = (path: string) => path.replace(/\\/g, '/')

function readFileFromDir(dirName: string, filePattern: string) {
    const files = fs.readdirSync(dirName);
    const matchedFile = files.find(file => {
        const filePath = nodePath.join(dirName, file);
        const isFile = fs.statSync(filePath).isFile();
        const matchesPattern = file.match(filePattern);
        return isFile && matchesPattern;
    });
    if(!matchedFile) {
        return null
    }
    return nodePath.join(dirName, matchedFile);
}

function removeRelativeSegments(filePath: string) {
    return filePath.replace(/(\.|\/)\//g, '');
}

module.exports = {
    getChangedFileDependencies
}
