module.exports = {
  prompts () {
    return [
      {
        name: 'name',
        message: 'What is the name of the new project?',
        default: this.outFolder,
        filter: val => val.toLowerCase(),
      },
      {
        name: 'humanizeName',
        message: 'And the humanize name?',
        default: 'My-App',
        filter: val => val.replace(/[\\\/]/g, '_'),
      },
      {
        name: 'description',
        message: 'How would you descripe it?',
        default: '⚡ A tiny app that improves your productive',
      },
      {
        name: 'website',
        message: 'The URL of its website',
      },
      {
        name: 'authorName',
        message: 'What is your name?',
        default: this.gitUser.username || this.gitUser.name,
        store: true,
      },
      {
        name: 'authorEmail',
        message: 'And your email?',
        default: this.gitUser.email,
        store: true,
      },
    ]
  },
  actions: [
    {
      type: 'add',
      files: '**',
    },
    {
      type: 'move',
      patterns: {
        gitignore: '.gitignore',
        '_package.json': 'package.json',
      }
    },
  ],
  async completed () {
    this.gitInit()
    await this.npmInstall()
    this.showProjectTips()
  },
}
