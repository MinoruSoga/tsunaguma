// import buffer from 'buffer'
// import stream from 'stream'

export function streamToBase64(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    stream.on('error', reject)
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const base64String = buffer.toString('base64')
      resolve(base64String)
    })
  })
}

export function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk: any) => {
      chunks.push(chunk)
    })
    stream.on('error', reject)
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })
  })
}

// Example usage
// const fs = require('fs');
// const readStream = fs.createReadStream('/path/to/file');

// streamToBase64(readStream)
//   .then((base64String) => {
//     console.log(base64String);
//   })
//   .catch((error) => {
//     console.error(error);
//   });
