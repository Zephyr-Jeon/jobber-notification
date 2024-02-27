import * as shell from 'shelljs';

// Copy emails folder into the build directory since email tempales are not TypeScript and not transfiled by tsc
shell.cp('-R', 'src/emails', 'build/src/');

// import * as fse from 'fs-extra';
// fse.copySync('src/emails', 'build/src/emails');
