const express = require("express");
var admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const session = require("express-session");
const router = new express.Router();
const allInfo = require("../infoapi");
var serviceAccount = require("../GoogleFirebaseKey.json");
var xxtea = require('xxtea-node');
const allInfo1 = require("../api")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://police-app-83d37.firebaseio.com",
});

let db = admin.firestore();
let police = db.collection("police");

router.get("/", (req, res) => {
  res.render("login", { message: "" });
});
router.get("/register", (req, res) => {
  res.render("register", { message: "" });
});
router.get("/bot",(req,res)=>{
  var userId = req.session.userId;
  var stationName = req.session.user;
  if (!userId) {
    res.redirect("/");
  } else { 
  if(req.query.lang=="hin"){
      res.render("bot1.ejs",{lang:"hin"})
  }else if(req.query.lang=="kan"){
      res.render("bot2.ejs",{lang:"kan"})
  }else if(req.query.lang=="tn"){
      res.render("bot3.ejs")
  }
  else if(req.query.lang=="te"){
      res.render("bot4.ejs")
  }
  else if(req.query.lang=="ml"){
      res.render("bot5.ejs")
  }else{
      res.render("bot.ejs")
  }
}
})
router.get("/chat",(req,res)=>{
  console.log(req.query.url+",,,"+req.query.input)
  if(!req.query.chain){
      req.query.prev_q= -1
  }
  allInfo1(req.query.url,req.query.input,req.query.firstno,req.query.lang,req.query.chain,req.query.prev_q,(err, {totalInfo}) => {
      if (err) throw new error();
      console.log(totalInfo);
      res.send({totalInfo:totalInfo})
    });
})
router.post("/register", async (req, res) => {
  console.log(req.params);

  user = req.body;
  req.body.password = await bcrypt.hash(user.password, 8);
  query = await police
    .where("stationName", "==", req.body.stationName)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        db.collection("police")
          .doc()
          .set(req.body)
          .then(() => {
            console.log("Successfully added user");
          });
      } else {
        console.log("account already exists");
        res.render("register", { message: "Account already exists" });
      }
    })
    .catch((err) => {
      console.log("Error getting documents", err);
    });
  res.redirect("/");
});
router.post("/", async (req, res) => {
  let police = db.collection("police");
  const stationName = req.body.stationName;
  const password = req.body.password;

  query = await police
    .where("stationName", "==", stationName)
    .get()
    .then(async (snapshot) => {
      if (snapshot.empty) {
        console.log("Account doesn't exist");
        res.render("login", {
          message: "account doesnt exist register please",
        });
      } else {
        snapshot.forEach(async (doc) => {
          console.log(doc.data());
          const isMatch = await bcrypt.compare(password, doc.data().password);
          if (!isMatch) {
            console.log("wrong password");
            res.render("login", { message: "Wrong Credentials" });
          } else {
            
            req.session.userId = doc.id;
            req.session.user = doc.data().stationName;
            res.redirect("/main");
          }
        });
      }
    })
    .catch((err) => {
      console.log("Error getting documents", err);
    });
});
router.get("/main", async (req, res) => {
  var userId = req.session.userId;
  var stationName = req.session.user;
  var policelat;
  var policelong;
  if (!userId) {
    res.redirect("/");
  } else {
    query = await police
      .where("stationName", "==", stationName)
      .get()
      .then(async (snapshot) => {
        if (snapshot.empty) {
          console.log("Account doesn't exist");
          res.render("login", {
            message: "account doesnt exist register please",
          });
        } else {
          snapshot.forEach(async (doc) => {
            console.log(doc.data());
            policelat = doc.data().latitude;
            policelong = doc.data().longitude;
          });
        }
      })
      .catch((err) => {
        console.log("Error getting documents", err);
      });
    let status = db.collection("status");
    let users = db.collection("users");
    var usersList = [];
    var usersList1 = Array();
    var usersList2 = Array();
    var countdist = 0;
    const queryList = await users
      .get()
      .then(async (snapshot) => {
        if (snapshot.empty) {
          console.log("No Users Found!");
        } else {
          snapshot.forEach(async (doc) => {
            try {
              var userlati = doc.data().latitude;
              var userlong = doc.data().longitude;

              function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2 - lat1); // deg2rad below
                var dLon = deg2rad(lon2 - lon1);
                var a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(deg2rad(lat1)) *
                    Math.cos(deg2rad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c; // Distance in km
                return d;
              }

              function deg2rad(deg) {
                return deg * (Math.PI / 180);
              }
              var distance = getDistanceFromLatLonInKm(
                policelat,
                policelong,
                userlati,
                userlong
              );
              if (distance < 200) {
                usersList.push(doc.id);
                usersList1.push(doc.data());
               
              }
              return;
            } catch (e) {
              console.log(e);
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
      usersList1.forEach(async(user)=>{ const queryStatus = await status
        .doc(user.uid)
        .collection("userStatus")
        .get()
        .then((snapshot) => {
          if (snapshot.empty) {
            console.log("No matching documents.");
            countdist+=1;
            
          } else {
            countdist+=1;
            console.log(countdist)
            snapshot.forEach((doc) => {
              
              
              user.dist = doc.data().distanceFromHome;
              
            });
            if (count === usersList1.length && countdist === usersList1.length) {
              console.log(usersList1);
              res.render("list.ejs", { usersList1: usersList1 });
            }
          }
        })
      })
    var count1 = 0;
    var count = 0;
    usersList.forEach(async (user) => {
      let getDoc = await status
        .doc(user)
        .collection("userStatus")
        .get()
        .then((snapshot) => {
          if (snapshot.empty) {
            console.log("No matching documents.");
            count += 1;
            count1 += 1;
            console.log("count1" + count1);
            if (count1 === usersList.length) {
              res.render("list.ejs", { usersList1: usersList1 });
            }
            return;
          } else {
            count += 1;
            
            snapshot.forEach((doc) => {
              usersList2.push(doc.data());
              usersList1.forEach(async(user) => {
                if (user.uid === doc.data().ownerId) {
                  console.log("doc:" + usersList2.length);
                  console.log("count:" + count);
                  var d = doc.data().timeStamp.toDate().toString();
                  var dhrs = doc.data().timeStamp.toDate();
                  var index = d.lastIndexOf(":") + 3;
                  var now = new Date();
                  var diffMs = now - dhrs;
                  var diffDays = Math.floor(diffMs / 86400000);
                  var diffHrs = Math.floor((diffMs % 86400000) / 3600000);
                  console.log("ul:" + usersList1.length);
                  if (diffHrs > 3 || diffDays > 1) {
                    user.status = 0;
                  } else {
                    user.status = 1;
                  }
                  user.updatedDate = d.substring(0, index);
                  
    
                }
              });
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
        
        if (count === usersList1.length && countdist === usersList1.length) {
          console.log(usersList1);
          res.render("list.ejs", { usersList1: usersList1 });
        }
      
    });
    
    
  }
});
router.get("/users/:uid", async (req, res) => {
  var user = req.session.userId;
  if (!user) {
    res.redirect("/");
  }
  var statusList = Array();
  var timeArray = Array();
  var user2;
  var user;
  var uid = req.params.uid;
  var latestUpdate = [];
  var url;
  let users = db.collection("users");
  let status = db.collection("status");
  const queryUser = await users
    .where("uid", "==", uid)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log("User not found");
      } else {
        snapshot.forEach((doc) => {
          console.log(doc.id, "=>", doc.data());
          user = doc.data();
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
  const queryStatus = await status
    .doc(uid)
    .collection("userStatus")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log("No matching documents.");
      } else {
        snapshot.forEach((doc) => {
          timeArray.push(doc.data().timeStamp.toDate().toString());
         user2 = doc.data()
          user2.temperature = xxtea.decryptToString(doc.data().temperature, "sumoo3011@1999")
          user2.peopleCount = xxtea.decryptToString(doc.data().peopleCount, "sumoo3011@1999")
          user2.mediaUrl    = xxtea.decryptToString(doc.data().mediaUrl, "sumoo3011@1999") 
          user2.location    = xxtea.decryptToString(doc.data().location, "sumoo3011@1999")
          user2.additionalInfo    = xxtea.decryptToString(doc.data().additionalInfo, "sumoo3011@1999")
          console.log(user2)
        
          statusList.push(user2);
          console.log(doc.id, "=>", doc.data());
          latestUpdate = user2;
        });
      }
    })
    .catch((err) => {
      console.log("This is media URL: ", latestUpdate.mediaUrl);
      console.log(err)
    });
  try {
    res.render("users", {
      user: user,
      statusList: statusList,
      imageUrl: latestUpdate.mediaUrl,
      latestUpdate: latestUpdate,
      timeArray: timeArray,
    });
  } catch (err) {
    res.render("users", {
      user: user,
      statusList: statusList,
      imageUrl:
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fadamtheautomator.com%2Fnew-aduser%2F&psig=AOvVaw1G47-ZExYvHOlhgETuO2K7&ust=1587658843567000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCNC94Zy4_OgCFQAAAAAdAAAAABAe",
      latestUpdate: latestUpdate,
    });
  }
});

router.post("/edit/:uid",async(req,res)=>{
  var user = req.session.userId;
  if (!user) {
    res.redirect("/");
  }
  
  
  var user;
  var uid = req.params.uid;
  
  let users = db.collection("users");
  var name=req.body.name
  var email = req.body.email
  var phoneno= req.body.phoneno
  var phoneno2 = req.body.phoneno2
  var address = req.body.address
  var count=0;
  const queryUser = await users
    .where("uid", "==", uid)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log("User not found");
      } else {
        snapshot.forEach((doc) => {
          count +=1;
          console.log(doc.id, "=>", doc.data());
          user = doc.data();
          if(name){user.name = name}
          if(email){user.email = email}
          if(address){user.address = address}
          if(phoneno){user.phoneno = phoneno}
          if(phoneno2){user.phoneno2 = phoneno2}
          
          
          
          
          db.collection("users")
          .doc(uid)
          .set(user)
          .then(() => {
            console.log("Successfully updated user");
          });
        });
          console.log(user)
          res.redirect("/users/"+uid)
        
      }
    })
    .catch((err) => {
      console.log(err);
    });
    
})


router.get("/covidinfo", (req, res) => {
  var user = req.session.userId;
  if (!user) {
    res.redirect("/");
  }
  allInfo((err, totalInfo) => {
    if (err) throw new error();
    console.log(totalInfo);
    res.render("info.ejs", { totalInfo: totalInfo });
  });
});

router.get('/map',async(req,res)=>{
  var userId = req.session.userId;
  var stationName = req.session.user;
  var policelat;
  var policelong;
  if (!userId) {
    res.redirect("/");
  } else {
    query = await police
      .where("stationName", "==", stationName)
      .get()
      .then(async (snapshot) => {
        if (snapshot.empty) {
          console.log("Account doesn't exist");
          res.render("login", {
            message: "account doesnt exist register please",
          });
        } else {
          snapshot.forEach(async (doc) => {
            console.log(doc.data());
            policelat = doc.data().latitude;
            policelong = doc.data().longitude;
          });
        }
      })
      .catch((err) => {
        console.log("Error getting documents", err);
      });
    let status = db.collection("status");
    let users = db.collection("users");
    var usersList = [];
    var usersList1 = Array();
    var usersList2 = Array();
    var countdist = 0;
    const queryList = await users
      .get()
      .then(async (snapshot) => {
        if (snapshot.empty) {
          console.log("No Users Found!");
        } else {
          snapshot.forEach(async (doc) => {
            try {
              var userlati = doc.data().latitude;
              var userlong = doc.data().longitude;

              function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2 - lat1); // deg2rad below
                var dLon = deg2rad(lon2 - lon1);
                var a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(deg2rad(lat1)) *
                    Math.cos(deg2rad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c; // Distance in km
                return d;
              }

              function deg2rad(deg) {
                return deg * (Math.PI / 180);
              }
              var distance = getDistanceFromLatLonInKm(
                policelat,
                policelong,
                userlati,
                userlong
              );
              if (distance < 200) {
                usersList.push(doc.id);
                usersList1.push(doc.data());
               
              }
              return;
            } catch (e) {
              console.log(e);
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
      usersList1.forEach(async(user)=>{ const queryStatus = await status
        .doc(user.uid)
        .collection("userStatus")
        .get()
        .then((snapshot) => {
          if (snapshot.empty) {
            console.log("No matching documents.");
            countdist+=1;
          } else {
            countdist+=1;
            console.log(countdist)
            snapshot.forEach((doc) => {
              
              
              user.lat = doc.data().latitude
              user.lng = doc.data().longitude
              
            });
            
          }

        })
        if(countdist==usersList1.length){
          
          var locList = Array()
          usersList1.forEach((user)=>{
            locList.push({lat:user.lat,lng:user.lng})
            
          })
          console.log(locList)
          res.send(locList)
        }
      })
      
    }
    
    
})


router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    res.render("login.ejs", { message: "" });
  });
});
module.exports = router;
