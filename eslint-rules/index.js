module.exports = {
	rules: {
		'no-const-except-at-top': require('./no-const-except-at-top'),
		'require-import-extension': require('./require-import-extension')
	},
	rulesConfig: {
		'no-const-except-at-top': 0,
		'require-import-extension': 0
	}
};
