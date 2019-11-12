const { say } = require('cowsay')

module.exports = () => say({ text: $l10n('HI') })
