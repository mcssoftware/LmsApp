'use strict';

const gulp = require('gulp');
const path = require('path');
const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Dropdown-container' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] src/sass/_LmsCore.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Button.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Font.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_General.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Grid.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Headings.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_hover.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Label.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Radiobutton.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Responsive.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Table-row.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Table.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] src/sass/mixins/_Textbox.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] The local CSS class 'panel-default' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] The local CSS class 'ms-WPBody' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] src\\sass\\mixins\\_Form.mixin.scss: filename should end with module.scss`);
build.addSuppression(`Warning - [sass] The local CSS class '-ms-flex' is not camelCase and will not be type-safe.`);

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    const lastDirName = path.basename(__dirname);
    const dropPath = path.join(__dirname, 'temp', 'stats');
    generatedConfiguration.plugins.push(new bundleAnalyzer.BundleAnalyzerPlugin({
      openAnalyzer: false,
      analyzerMode: 'static',
      reportFilename: path.join(dropPath, `${lastDirName}.stats.html`),
      generateStatsFile: true,
      statsFilename: path.join(dropPath, `${lastDirName}.stats.json`),
      logLevel: 'error'
    }));

    return generatedConfiguration;
  }
});

build.initialize(gulp);

// gulp clean
// gulp serve --nobrowser
// gulp build
// gulp bundle --ship
// gulp package-solution --ship
// gulp deploy-azure-storage
