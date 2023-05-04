import nodePath from 'path'
import dependencyTree from '@tregdor/dependency-tree'

const fileExtensions = ['.ts', '.tsx']

interface IFile {
    filename: string
    status: string
    patch: string
}

const getChangedFileDependencies = (files: IFile[]) => {
    const filesWithNecessaryExtensions = files
        .filter(({filename}) => fileExtensions
            .some((extension) => filename.endsWith(extension)))

    const filesPathForGraph = new Set();
    filesWithNecessaryExtensions.forEach((file) => {
        if (file.status === 'removed') return;
        filesPathForGraph.add(normalize(nodePath.resolve(file.filename)))

        const dependecies = dependencyTree({
            filename: file.filename,
            directory: nodePath.dirname(file.filename)
        }) as unknown as string[];
        // find added files in PR
        //TODO add ability to configure line ending
        file.patch.split('\n').forEach((line) => {
            // example
            // +import { useAgent } from 'hooks';",
            if (line.startsWith('+import')) {
                const importFilepath = getImportedFilePath(file.filename, line, dependecies)
                if (importFilepath) {
                    filesPathForGraph.add(normalize(importFilepath))
                }
            }
        })
    })
    return Array.from(filesPathForGraph)
}

function getImportedFilePath(mainFilePath: string, lineWithImport: string, tree: string[]) {
    const match = lineWithImport.match(/import.*from\s*['"](.*)['"]/);

    if (match) {
        const importedPath = match[1];
        const filePath = nodePath.join(nodePath.dirname(mainFilePath), importedPath)

        return tree.find((dep) => dep.includes(filePath))
    }
    return null;
}

const normalize = (path: string) => path.replace(/\\/g, '/')


module.exports = {
    getChangedFileDependencies
}
