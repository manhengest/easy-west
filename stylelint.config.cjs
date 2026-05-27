/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard-scss'],
  customSyntax: 'postcss-scss',
  rules: {
    'selector-class-pattern': [
      '^([a-z][a-z0-9-]*)(__[a-z0-9]+(-[a-z0-9]+)*)?(_[a-z][a-z0-9-]*(-[a-z0-9]+)*)?$',
      {
        message:
          'Use BEM: block, block__element, block_modifier (single underscore after block, not --)',
      },
    ],
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['theme', 'apply', 'reference', 'tailwind'],
      },
    ],
  },
}
