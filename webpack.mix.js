let mix = require('laravel-mix');

mix
    .ts('src/main-process/main.ts', 'build/')
    .webpackConfig({
        target: 'electron-main',
        node: {
            __dirname: false,
            __filename: false,
        }
    });

mix
    .sass('assets/styles/app.scss', 'build/assets/styles/')
    .ts('src/ui/app.ts', 'build/')
    .copy('assets/lib/fontawesome-all.min.js', 'build/assets/lib/')
    .copy('assets/static/index.html', 'build/')
    .copyDirectory('assets/translations', 'build/assets/translations')
    .copyDirectory('assets/logo', 'build/logo')
    .webpackConfig({
        target: 'electron-renderer',
        node: {
            __dirname: false,
            __filename: false,
        }
    });