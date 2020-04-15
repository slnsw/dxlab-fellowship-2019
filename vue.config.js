module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
      description:
        'A broad-based and serendipitous exploration of the Library’s collection.',
      title: 'Aereo | a DX Lab project'
    }
  },
  // publicPath:
  //   process.env.NODE_ENV === 'production' ? '/dxlab-fellowship-2019/' : '/'
  publicPath: process.env.NODE_ENV === 'production' ? '/aereo/' : '/' // for S3
}
