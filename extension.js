const vscode = require('vscode');
const fs = require('fs');
const webAppPublishPath = vscode.workspace.getConfiguration('writeVersion').get('webAppPublishPath');
const needPageVers = vscode.workspace.getConfiguration('writeVersion').get('needPageVers');

function dateFormat(fmt, date) {
    let ret;
    let opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}
function writeHtmlVersion(filePath, suffix, fileName) {
	if (!needPageVers) {
		return;
	}
	try {
		let file = fs.readFileSync(filePath).toString();
		if (needPageVers) {
			file = file.replace(/(data-page-vers)="([\d\_\-\w]+)"/, '$1="' + dateFormat('YYYYmmddHHMM', new Date()) + '"');
		}
		
		const bf = Buffer.from(file);
		fs.writeFileSync(filePath, bf);
		if (webAppPublishPath)
			fs.writeFileSync(getTargetPath(filePath), bf);
	} catch(err) {
		console.log(err)
	}
}
function copyFile(sourcePath) {
	if (!webAppPublishPath) return;
	var readStream = fs.createReadStream(sourcePath);
	var writeStream = fs.createWriteStream(getTargetPath(sourcePath));
	readStream.pipe(writeStream);
}
function getTargetPath(sourcePath) {
	return sourcePath.replace(/.+\/webapp\/(\w+)/, webAppPublishPath + '$1');
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('extension.writeVersion', function () {
		let includes = vscode.workspace.getConfiguration('writeVersion').get('includes');
		includes = includes && includes.length ? includes : ['\/page\/'];
		
    	const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    
		const suffix = filePath.substr(filePath.lastIndexOf('.') + 1);
		const fileName = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
		
        let isInclude = false
        for (let i=0; i<includes.length; i++) {
            if (~filePath.indexOf(includes[i])) {
                isInclude = true;
                break;
            }
        }
        if (isInclude) {
            if (suffix === 'js') {
                writeHtmlVersion(filePath.replace('.js', '.html'), 'js', 'ytfw');
            } else if (suffix === 'css') {
                writeHtmlVersion(filePath.replace(/\/css\/(\w+).css/, '\/$1.html'), 'css', fileName);
            }
            vscode.commands.executeCommand('workbench.action.files.save').then(function() {
                copyFile(filePath);
            });
        } else {
            vscode.commands.executeCommand('workbench.action.files.save').then(function() {
            });
        }
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
