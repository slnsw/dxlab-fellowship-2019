module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Aereo'
    }
  },
  // publicPath:
  //   process.env.NODE_ENV === 'production' ? '/dxlab-fellowship-2019/' : '/'
  publicPath: process.env.NODE_ENV === 'production' ? '/viewer/' : '/' // for S3
}
