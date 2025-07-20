googleBooksAPI.js:51  GET https://www.googleapis.com/books/v1/volumes?q=isbn:9780439708180&key=your_api_key_here 400 (Bad Request)
getBookByISBN @ googleBooksAPI.js:51
await in getBookByISBN
testGoogleBooksAPI @ googleBooksAPI.js:281
loadBooks @ App.jsx:100
(anonymous) @ App.jsx:125
react-stack-bottom-frame @ react-dom-client.development.js:23949
runWithFiberInDEV @ react-dom-client.development.js:1519
commitHookEffectListMount @ react-dom-client.development.js:11905
commitHookPassiveMountEffects @ react-dom-client.development.js:12026
reconnectPassiveEffects @ react-dom-client.development.js:14004
recursivelyTraverseReconnectPassiveEffects @ react-dom-client.development.js:13976
reconnectPassiveEffects @ react-dom-client.development.js:14051
doubleInvokeEffectsOnFiber @ react-dom-client.development.js:15968
runWithFiberInDEV @ react-dom-client.development.js:1519
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15928
commitDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15977
flushPassiveEffects @ react-dom-client.development.js:15747
(anonymous) @ react-dom-client.development.js:15379
performWorkUntilDeadline @ scheduler.development.js:45
<App>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
(anonymous) @ main.jsx:8Understand this error
hook.js:608 Failed to fetch book with ISBN 9780439708180: Error: API request failed: 400
    at GoogleBooksAPI.getBookByISBN (googleBooksAPI.js:54:15)
    at async testGoogleBooksAPI (googleBooksAPI.js:281:22)
    at async loadBooks (App.jsx:100:9)