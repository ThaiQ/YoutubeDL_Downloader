const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const { download_mp4, download_mp3, parsePlaylist, getInfo } = require('./ytbe')
const { searchMemories } = require('./init')

const app = express();
app.use(bodyParser.json());

let unique_counts = 0
let downloads = new Map()
let downloaded = new Map()
let downloading = false
let downloading_obj = null
let memo_files = searchMemories()

//playlist params
let playlist = []
let playlist_ext = null

app.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, '/web.html'));
})

app.get('/ping', function (req, res) {
   res.status(200).send({ downloading_obj, downloads: Array.from(downloads.values()), downloaded: Array.from(downloaded.values()), memo_files, playlist });
})

app.get('/cleardownloads', function (req, res) {
   if (req.query.downloaded!=null) {
      downloaded.clear()
      memo_files = []
   }
   downloads.clear()
   res.status(200).send({ downloading_obj, downloads: Array.from(downloads.values()), downloaded: Array.from(downloaded.values()), memo_files, playlist });
})

app.post('/add', async function (req, res) {
   let info = await getInfo(req.body.url)

   if (req.body.url.includes('playlist')) {
      playlist = await parsePlaylist(req.body.url)
      playlist_ext = req.body.ext
      res.status(200).send({ playlist })
      return
   }

   else if (info && info.owner != 'YouTube Movies' && !(Array.from(downloads.values()).some(obj => obj.id === info.id) || memo_files.includes(info.filename + '.' + req.body.ext) || Array.from(downloaded.values()).some(obj => obj.id === info.id))) {
      info.ext = req.body.ext
      info.unique_counts = unique_counts
      downloads.set(unique_counts, info)
      unique_counts++
   }

   res.status(200).send(info)
})

app.post('/plind', async function (req, res) {
   let start = (req.body.start || 1) - 1
   let end = (req.body.end || playlist.length - 1) + 1
   if (playlist.length > 0) {
      let ext = playlist_ext
      playlist = playlist.slice(start, end)
      playlist.forEach(async (url) => {
         let info = await getInfo(url)
         if (info && info.owner != 'YouTube Movies' && !(Array.from(downloads.values()).some(obj => obj.id === info.id) || memo_files.includes(info.filename + '.' + req.body.ext) || Array.from(downloaded.values()).some(obj => obj.id === info.id))) {
            info.ext = ext
            info.unique_counts = unique_counts
            downloads.set(unique_counts, info)
            unique_counts++
         }
      })
      playlist_ext=null
      playlist=[]
   }
   res.status(200).send({downloads})
})

app.post('/edit', async function (req, res) {
   let key = parseInt(req.body.unique_counts)
   let obj = downloads.get(key)
   if ((obj && downloading_obj == null) || (obj && downloading_obj.id != obj.id)) {
      obj.ext = req.body.ext
      downloads.set(key, obj)
   }
   res.status(200).send({done:true})
})

app.post('/editAll', async function (req, res) {
   let keys = req.body.list
   keys.forEach(u_c=>{
      if (downloading_obj==null || u_c!=downloading_obj.unique_counts){
         let obj = downloads.get(u_c)
         obj.ext = req.body.ext
         downloads.set(u_c,obj)
      }
   })
   res.status(200).send({done:true})
})

app.post('/delete', async function (req, res) {
   let key = parseInt(req.body.unique_counts)
   let obj = downloads.get(key)
   if ((obj && downloading_obj == null) || (obj && downloading_obj.id != obj.id)) {
      downloads.delete(key)
   }
})

async function download() {
   if (downloads.size > 0 && downloading == false) {
      let obj = Array.from(downloads.values())[0]
      downloading = true
      downloading_obj = obj


      if (obj.ext == 'mp4')
         obj = await download_mp4(null, obj, () => {
            downloads.delete(obj.unique_counts)

            downloaded.set(obj.unique_counts, obj)
            downloading_obj = null
            downloading = false
         })
      else if (obj.ext == 'mp3')
         obj = await download_mp3(null, obj, () => {
            downloads.delete(obj.unique_counts)

            downloaded.set(obj.unique_counts, obj)
            downloading_obj = null
            downloading = false
         })

   }
}

setInterval(download, 1000);


var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})