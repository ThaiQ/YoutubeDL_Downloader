const fs = require('fs');

let ind = process.argv.indexOf('--path') //node server --path [path to folder]
let path = ind>0? process.argv[ind+1]:'.'

if (!fs.existsSync(path+"/downloads/")) {
    fs.mkdirSync(path+"/downloads/");
}
for (let dir of ["/downloads/mp4/", "/downloads/mp3/"])
    if (!fs.existsSync(path+dir)) {
        fs.mkdirSync(path+dir);
    }

function searchMemories() {
    let memo_files = []
    let files = fs.readdirSync(path+'/downloads/mp3/');
    files = files.filter(name => name.includes('.mp3'))
    memo_files = memo_files.concat(files)
    files = fs.readdirSync(path+'/downloads/mp4/');
    files = files.filter(name => name.includes('.mp4'))
    memo_files = memo_files.concat(files)
    return memo_files
}

module.exports= {searchMemories,path}