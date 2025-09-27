const sqlite3 = require('sqlite3').verbose()
const path = require('path');
const rootpath = path.resolve (__dirname, '..')

const db = new sqlite3.Database(`${rootpath}/Ice.db`, sqlite3.OPEN_READWRITE, (err) => {
    if(err){
        console.log(err);
    }
    console.log('Successful connection to the databse')
});
module.exports = {
    db
}