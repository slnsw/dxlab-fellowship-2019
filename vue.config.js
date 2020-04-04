module.exports = {
  publicPath:
    process.env.NODE_ENV === 'production' ? '/dxlab-fellowship-2019/' : '/'
  // publicPath: process.env.NODE_ENV === 'production' ? '/viewer/' : '/' // for S3
}
