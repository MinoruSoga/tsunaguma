export default {
  getRepository(repo) {
    return repo
  },
  getCustomRepository(repo) {
    return repo
  },
  transaction(isolationOrCb, cb) {
    if (typeof isolationOrCb === 'string') {
      return cb(this)
    } else {
      return isolationOrCb(this)
    }
  },
}
