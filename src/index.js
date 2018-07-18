const crypto = require('crypto')
const http = require('http')
const url = require('url')

module.exports = pluginContext => {
  function md5 (text) {
    return crypto.createHash('md5').update(text).digest('hex').toUpperCase()
  }

  function buildUrl (q, env = {}) {
    const salt = '' + Date.now()
    const sign = md5(env.appKey + q + salt + env.appSecret)

    return url.format({
      protocol: 'http',
      hostname: 'openapi.youdao.com',
      pathname: '/api',
      query: {
        q: q,
        from: 'auto',
        to: 'auto',
        appKey: env.appKey,
        salt: salt,
        sign: sign
      }
    })
  }

  function asResult (text) {
    return {
      id: text,
      icon: 'fa-search',
      title: text,
      value: text
    }
  }

  return (query, env = {}) => {
    return new Promise((resolve, reject) => {
      const queryUri = buildUrl(query, env);
      http.get(queryUri, res => {
        let body = ''

        res.on('data', chunk => {
          body += chunk
        })

        res.on('end', () => {
          pluginContext.console.log('info', body)
          const data = JSON.parse(body)

          const results = [];
          try {
            data.translation.forEach(t => results.push(asResult(t)))
            data.basic.explains.forEach(t => results.push(asResult(t)))
          } catch (_) {}

          results.forEach((result, i) => {
            result.id = `${query}_${i}`
          })

          resolve(results)
        })
      }).on('error', err => reject(err))
    })
  }
}
