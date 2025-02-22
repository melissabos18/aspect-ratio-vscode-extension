// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const disposable = vscode.commands.registerCommand('aspect-ratio-calculator.calculateAspectRatio', function () {
		const editor = vscode.window.activeTextEditor
		if (!editor) {
			vscode.window.showErrorMessage("No active editor find")
			return
		}

		const document = editor.document;
		if (!['babel', 'postcss', 'javascript'].includes(document.languageId)) {
			vscode.window.showErrorMessage("This only works in a Babel JavaScript or PostCSS file.")
			return
		}

		if (document.languageId === "postcss") {
			getCSSAspectRatio()
		}

		if (document.languageId === "javascript") {
			getReactAspectRatio()
		}

		function getReactAspectRatio() {
			const selection = editor.selection
			const text = document.getText(selection)

			const regex = /(\d+)\s*\/\s*(\d+)/

			const formatValue = text.match(regex)

			if (!formatValue) {
				vscode.window.showErrorMessage("Select both values for calculating the aspect ratio, example: 400 / 500")
				return
			}

			const width = formatValue[1]
			const height = formatValue[2]
			const aspectRatio = getNearestNormalAspectRatio(width, height)

			getInformationMessage({
				selection,
				aspectRatio,
				replaceMessage: aspectRatio
			})
		}

		function getCSSAspectRatio() {
			const selection = editor.selection
			const text = document.getText(selection)

			const widthMatch = text.match(/width:\s*(\d+)px/)
			const heightMatch = text.match(/height:\s*(\d+)px/)

			if (!widthMatch || !heightMatch) {
				vscode.window.showErrorMessage("Select two css rules with both width and height properties")
				return
			}

			const width = widthMatch ? widthMatch[1] : null
			const height = heightMatch ? heightMatch[1] : null

			if (width === null || height === null) {
				vscode.window.showErrorMessage('There is no calculation possible for these values')
				return
			}

			const aspectRatio = getNearestNormalAspectRatio(width, height)
			getInformationMessage({
				selection,
				aspectRatio,
				replaceMessage: `aspect-ratio: ${aspectRatio};`
			})
		}

		function getInformationMessage({selection, aspectRatio, replaceMessage}) {
			return (
				vscode.window.showInformationMessage(
					`Aspect ratio is: ${aspectRatio}`,
					'Yes replace the width and height',
				).then(select => {
					if (select === 'Yes replace the width and height') {
						editor.edit(editBuilder => {
							editBuilder.replace(selection, replaceMessage)
						})
					}
				})
			)
		}

		function getNearestNormalAspectRatio(width, height, side = 1, maxW = 10, maxH = 10) {
			const ratio = width / height
			const ratios = new Set()

			for (let w = 1; w <= maxW; w++) {
				for (let h = 1; h <= maxH; h++) {
						ratios.add(`${w} / ${h}`)
				}
			}

			return [...ratios].reduce((best, current) => {
				const [w, h] = current.split('/').map(Number);
				const currentRatio = w / h

				if (!best) return current;
				const bestRatio = best.split('/').map(Number).reduce((a, b) => a / b)

				const isBetter =
					(!side && Math.abs(ratio - currentRatio) < Math.abs(ratio - bestRatio)) ||
					(side < 0 && currentRatio <= ratio && Math.abs(ratio - currentRatio) < Math.abs(ratio - bestRatio)) ||
					(side > 0 && currentRatio >= ratio && Math.abs(ratio - currentRatio) < Math.abs(ratio - bestRatio))

				return isBetter ? current : best;
			}, null)
		}
	})

	context.subscriptions.push(disposable)
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
