const vscode = require('vscode');
const fs = require('fs');

function writeHtmlVersion(filePath, suffix, fileName) {
	try {
		let file = fs.readFileSync(filePath).toString();
		var t = new RegExp('(' + fileName + ').(' + suffix + ')(\\??.*)(\"|\')');
		file = file.replace(t, '$1.$2?' + new Date().getTime() + '$4');
		fs.writeFileSync(filePath, Buffer.from(file));

	} catch(err) {
		console.log(err)
	}
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('extension.writeVersion', function () {
		const includes = vscode.workspace.getConfiguration('writeVersion').get('includes')
    const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    
		const suffix = filePath.substr(filePath.lastIndexOf('.') + 1);
		const fileName = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.lastIndexOf('.'));
		if (includes && includes.length && ['css', 'js'].includes(suffix)) {
			let isInclude = false
			for (let i=0; i<includes.length; i++) {
				if (~filePath.indexOf(includes[i])) {
					isInclude = true;
					break;
				}
			}
			if (!isInclude) {
				vscode.commands.executeCommand('workbench.action.files.save');
				return false;
			}
		}
		
		if (suffix === 'js') {
			writeHtmlVersion(filePath.replace('.js', '.html'), 'js', fileName);
		} else if (suffix === 'css') {
			writeHtmlVersion(filePath.replace(/\\css\\(\w+).css/, '\\$1.html'), 'css', fileName);
		}
		
		vscode.commands.executeCommand('workbench.action.files.save');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
