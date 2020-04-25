var allInfo = (callback)=>{
    var request = require("request");
    var options = {
      method: 'GET',
      url: 'https://api.covid19india.org/data.json',
      json : true,
    };
    var totalInfo = Array() 
    request(options, function (err, res) {
      if(err){
        callback('unable to connect to the internet -.- ',undefined)
    }else{
        
      callback(undefined,{ totalInfo:res.body.statewise[0]})
  
        }
        
    })
}
module.exports = allInfo