# Bitcoin Node Test

Test application for using multichain api for raw transaction processing. There are 3 features.

  - Enter transaction params and write raw transaction to chain yourserlf.
  - Get headers of chain's block by its hash or height value.
  - Read infromation about transaction by its `txid`


### Cookbok
 1. You need to download and install multichain on your local machine or remote server. **Download** [here](https://www.multichain.com/download-install/)
 2. You have to create your own personal blockchain and run it as a demon. **Guidance** [here](https://www.multichain.com/getting-started/)
 3. Then clone the project **Bitcoin Node Test**, go to its directory and install dependencies with `npm i` 
 4. In `/routes/multichain` change credentials to you personal blockchain data
 4.1. Use `default-rpc-port` value for `port` (you could find it in params.dat in your multichain directory)
 4.2. `user` and `pass` you find in `multichain.conf` file in current blockchain directory;
 5. To write transaction you need to input `[array of transactions];{key-value object for the addresses}`. Like JSON data. 
 5.1. Example : 
`[{"txid":"aa812d0177c21463f3e08039a78687d0dd6963e5fcdf37a6859f051cac332b07","vout":0},{"txid":"91f68ca6a6dd0bce393218cb94fff87801d704c048d2b7866641cdc36e138d14","vout":0}];
{"1Zbt1zk3wyWPkkbcvoppxG9hsTybTggyqjZqyx": {"asset5":20,"asset6":30},"1C3BM8DqwvBcbZswJhjGQDJUxHRG4XdQx3Zr9a":{"asset5":30,"asset6":20}}`
5.2. How to get `txid`, `assets` and `addresses` you could read [here](https://www.multichain.com/developers/raw-transactions/)
6. To read headers of block of you chain you need just input its `height` or `hash` value.
7. To read transaction you need to input transaction `txid`.
`

