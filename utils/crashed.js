'use strict';

/**
 * Log on failed render
 * @module
 * @author Oleg Dutchenko <dutchenko.o.dev@gmail.com>
 * @version 1.0.0
 */

// ----------------------------------------
// Imports
// ----------------------------------------

const chalk = require('chalk');
const fs = require('fs');
const ejsLint = require('ejs-lint');
const esprima = require('esprima');
const lodash = require('lodash');
const pkg = require('../package.json');

const ejsLintRegExp = /(If the above error is not helpful, you may want to try EJS-Lint:)(.|\n)*(https:\/\/github\.com\/RyanZim\/EJS\-Lint)/;
const filenameRegExp = new RegExp(`(\\s+\\d+\\|\\s${pkg.gulpEjsMonster.newline})(.+)`, 'g');
const filenameRegExpIn = new RegExp(pkg.gulpEjsMonster.newline, 'g');

// ----------------------------------------
// Public
// ----------------------------------------

function crashed (error, storage, renderOptions) {
	storage.push(chalk.red('→ CRASH...\n'), false, '>');
	let errorMessage;

	if (error === null) {
		errorMessage = 'no errors';
	} else {
		errorMessage = error.toString().replace(ejsLintRegExp, '').replace(/\n\n+/g, '');
		errorMessage = errorMessage.replace(filenameRegExp, (str, g1, g2) => '\n\n' + chalk.gray(g2));
		errorMessage = errorMessage.replace(filenameRegExpIn, '');
	}

	let messages = [
		'\n>>> render history:',
		chalk.white(storage.print()),
		'\n>>> ejs report:',
		chalk.white(errorMessage)
	];

	storage.paths.forEach(itemPath => {
		const fileContent = fs.readFileSync(itemPath).toString();
		const options = lodash.merge({}, renderOptions, {compileDebug: true});

		// ejsLint
		if (/\.ejs$/.test(itemPath)) {
			let ejsLintResult = ejsLint(fileContent, options);

			if (ejsLintResult) {
				ejsLintResult = ejsLintResult.toString().replace(/^\n/, '');
				ejsLintResult = ejsLintResult.replace('anonymous file', chalk.gray(itemPath));
				messages.push('\n>>> ejs-lint report:', chalk.white(ejsLintResult));
			}
		}

		// esprima test
		if (/\.js$/.test(itemPath)) {
			try {
				esprima.parseScript(fileContent);
			} catch (err) {
				messages.push('\n>>> esprima report:', chalk.white(err.toString()));
			}
		}
	});

	console.log(chalk.yellow([
		pkg.gulpEjsMonster.divider,
		`${pkg.name} errors reports:`,
		messages.join(`\n`),
		pkg.gulpEjsMonster.divider,
		'Reports end!'
	].join('\n')));
}

crashed.reRenderLog = function (filePath) {
	console.log(chalk.yellow([
		pkg.gulpEjsMonster.divider,
		`Oops! ${pkg.name} crashed while render file:`,
		filePath,
		'"compiledDebug" option is disabled.',
		'Starting re-render for to detect what\'s went wrong ...'
	].join('\n')));
};

// ----------------------------------------
// Exports
// ----------------------------------------

module.exports = crashed;