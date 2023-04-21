import {describe, expect, test} from '@jest/globals';

const {getChangedFileDependencies} = require('../lib/getChangedFileDependencies');


describe('getChangedFileDependencies', () => {
    test('common JS module', () => {
        const entryFilePath = 'testFiles/CommonJs/test_file.ts'
        const patch = '@@ -1,3 +1,6 @@\n' +
                " import {dependency_1} from './dependency_1';\n" +
                "+import {dependency_2} from './dependency_2';\n" +
                "+import {dependency_3} from './dependency_3';\n" +
                "+import {dependency_4} from './dependency_4';\n" +
                ' \n' +
                '-const workWithDependency = dependency_1\n' +
                '+const workWithDependency = dependency_1 + dependency_2 + dependency_3 + dependency_4'
        const dependencies = ['testFiles/CommonJs/test_file.ts', "testFiles/CommonJs/dependency_2.ts", "testFiles/CommonJs/dependency_3.ts", "testFiles/CommonJs/dependency_4.js"]
        const foundedDependencies = getChangedFileDependencies([{filename: entryFilePath, status: 'modified', patch }])
        expect(foundedDependencies[0]).toBe(dependencies[0])
        expect(foundedDependencies[1]).toBe(dependencies[1])
        expect(foundedDependencies[2]).toBe(dependencies[2])
        expect(foundedDependencies[3]).toBe(dependencies[3])
    })
})
