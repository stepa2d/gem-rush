import React from 'react'
import ReactDOM from 'react-dom/client'

import('./App').then(({ default: GemRush }) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GemRush />
    </React.StrictMode>
  )
}).catch(e => {
  document.getElementById('root').innerHTML =
    '<pre style="color:#ff5252;padding:20px;font-size:14px;word-wrap:break-word;white-space:pre-wrap">' +
    e.message + '\n\n' + e.stack + '</pre>'
})
