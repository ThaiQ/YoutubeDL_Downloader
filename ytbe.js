const fs = require('fs')
const ytpl = require('ytpl');
const {path} = require('./init');
const ytdl = require('ytdl-core');
const ytmux = require('ytdl-core-muxer');
const { validateURL } = require('ytdl-core');

let isLetter = a => a.toLowerCase() != a.toUpperCase()
let filterTitle = title => title.split("").filter((letter) => isLetter(letter) || ' ,-!+[]()'.includes(letter) || Number.isInteger(parseInt(letter))).join("")

async function download_mp4(url = '', info_param=null, callback = () => { }) {
    let info = info_param || await getInfo(url)
    if (info == null) return null

    let title = path+"/downloads/mp4/" + info.filename
    let video = ytmux(info.url).pipe(fs.createWriteStream(`${title}.mp4`)).on("finish", callback);

    info.path = title + '.mp4'
    info.filename_ext = `${info.filename}.mp4`
    return info
}

async function download_mp3(url = '', info_param=null, callback = () => { }) {
    let info = info_param || await getInfo(url)
    if (info == null) return null

    let title = path+"/downloads/mp3/" + info.filename
    let video = ytdl(info.url, { quality: 'highestaudio' }).pipe(fs.createWriteStream(`${title}.mp3`)).on("finish", callback);

    // video.on('progress', (chunkLength, downloaded, total) => {
    //     let percent = downloaded / total;
    //     percent = `${(percent * 100).toFixed(1)}%`
    //     console.log('downloading', percent);
    // });

    info.path = title + '.mp3'
    info.filename_ext = `${info.filename}.mp3`
    return info
}

async function getInfo(url) {
    if (validateURL(url)) {
        let info = (await ytmux.getBasicInfo(url)).videoDetails

        let owner = info.ownerChannelName
        let origin_title = info.title
        let title = filterTitle(origin_title)
        let id = info.videoId
        url = info.video_url
        
        return { owner, title, origin_title, id, url, filename: `${title} -- ${owner} -- ${id}` }
    }
    return null
}

async function parsePlaylist(url) {
    let playlist_urls = (await ytpl(url)).items.map(obj => obj.url);
    return playlist_urls || null
}

module.exports = { download_mp4, download_mp3, parsePlaylist, getInfo }
