var express = require('express');
var request = require("request");
var cheerio = require("cheerio");
var firebase = require("firebase");

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBkI3hRVzBvE60PnEfu93go0J88jg6f3C0",
    authDomain: "ncnuclass.firebaseapp.com",
    databaseURL: "https://ncnuclass.firebaseio.com",
    projectId: "ncnuclass",
    storageBucket: "ncnuclass.appspot.com",
    messagingSenderId: "752360146828"
};
firebase.initializeApp(config);
var db = firebase.database();

var allOtherClass = {};
var allSportClass = {};
var timerForGet, timerForGetS;

var app = express();
var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

var email = process.env.email;
var pass = process.env.password;
firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(function () {
        user = firebase.auth().currentUser;
        if (user) {
            db.ref("/other/allClass").once('value', function (snap) {
                allOtherClass = snap.val();
                if (!allOtherClass) {
                    firstGetData();
                    console.log("No data in other, it's downloading");
                } else {
                    console.log("download all other classes");
                    getAllOtherClass();
                }
                // console.log(allOtherClass);
            })
            db.ref("/other/allClass").on('value', function (snap) {
                allOtherClass = snap.val();
            })

            db.ref("/sport/allClass").once('value', function (snap) {
                allSportClass = snap.val();
                if (!allSportClass) {
                    firstGetData_sport();
                    console.log("No data in sport, it's downloading");
                } else {
                    console.log("download all sport classes");
                    getAllSportClass();
                }
            })
            db.ref("/sport/allClass").on('value', function (snap) {
                allSportClass = snap.val();
            })
        }
    })
    .catch(function (error) {
        var errorMessage = error.message;
        console.log(errorMessage)
    })

app.get('/', function (req, res) {
    var message = {
        flag: '{DOnt_hACk_mE_QQ}'
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.stringify(message));
});



function firstGetData() {
    request({
        url: "https://ccweb.ncnu.edu.tw/student/aspmaker_course_opened_detail_viewlist.php?cmd=search&t=aspmaker_course_opened_detail_view&x_year=1071&x_deptid=99&recperpage=200",
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            res.status(404).send("some errors");
            return;
        }
        var $ = cheerio.load(body);

        var allClass = {};
        var classNum = 0;

        // 課程總數
        $(".ewPager span").each(function (i, e) {
            var tmp = $(e).text().split("／");
            classNum = tmp[1].replace(" ", "");
            console.log("Total " + tmp[1].replace(" ", "") + " classes");
        });

        // ID 選擇
        for (var i = 1; i <= classNum; i++) {
            allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")] = {
                limit: $("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""),
                seleced_no: $("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", ""),
                teacher: $("#el" + i + "_aspmaker_course_opened_detail_view_teachers>span").text().replace("\n", ""),
                time: $("#el" + i + "_aspmaker_course_opened_detail_view_time>span").text().replace("\n", ""),
                place: $("#el" + i + "_aspmaker_course_opened_detail_view_place>span").text().replace("\n", ""),
                fill: parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", "")),
                lock: false,
                startTime: 0
            };
        }
        // console.log(allClass)
        db.ref("/other").set({
            allClass
        }).then(function () {
            console.log("first set data");
            getAllOtherClass();
        }).catch(function () {
            console.log("some error");
        });
    });
}

function firstGetData_sport() {
    request({
        url: "https://ccweb.ncnu.edu.tw/student/aspmaker_course_opened_detail_viewlist.php?cmd=search&t=aspmaker_course_opened_detail_view&x_year=1071&x_deptid=90&recperpage=200",
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            res.status(404).send("some errors");
            return;
        }
        var $ = cheerio.load(body);

        var allClass = {};

        // ID 選擇
        for (var i = 1; i <= 34; i++) {
            allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"] = {
                limit: $("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""),
                seleced_no: $("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", ""),
                teacher: $("#el" + i + "_aspmaker_course_opened_detail_view_teachers>span").text().replace("\n", ""),
                time: $("#el" + i + "_aspmaker_course_opened_detail_view_time>span").text().replace("\n", ""),
                place: $("#el" + i + "_aspmaker_course_opened_detail_view_place>span").text().replace("\n", ""),
                fill: parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", "")),
                lock: false,
                startTime: 0
            };
        }
        // console.log(allClass)
        db.ref("/sport").set({
            allClass
        }).then(function () {
            console.log("first set data");
            getAllSportClass();
        }).catch(function () {
            console.log("some error");
        });
    });
}


function getAllOtherClass() {
    clearTimeout(timerForGet);
    request({
        url: "https://ccweb.ncnu.edu.tw/student/aspmaker_course_opened_detail_viewlist.php?cmd=search&t=aspmaker_course_opened_detail_view&x_year=1071&x_deptid=99&recperpage=200",
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            res.status(404).send("some errors");
            return;
        }
        var $ = cheerio.load(body);

        var allClass = {};
        var classNum = 0;

        // 課程總數
        $(".ewPager span").each(function (i, e) {
            var tmp = $(e).text().split("／");
            classNum = tmp[1].replace(" ", "");
            console.log("Total " + tmp[1].replace(" ", "") + " classes");
        });

        // ID 選擇
        for (var i = 1; i <= classNum; i++) {
            allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")] = {
                limit: $("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""),
                seleced_no: $("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", ""),
                teacher: $("#el" + i + "_aspmaker_course_opened_detail_view_teachers>span").text().replace("\n", ""),
                time: $("#el" + i + "_aspmaker_course_opened_detail_view_time>span").text().replace("\n", ""),
                place: $("#el" + i + "_aspmaker_course_opened_detail_view_place>span").text().replace("\n", ""),
                fill: parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", "")),
                lock: allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].lock,
                startTime: allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].startTime
            };
            // 某課程舊資料是否是滿的
            var oldStatus = allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].fill == true;
            var oldStatus_lock = allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].lock == false;
            // 某課程新資料是否是滿的
            var newStatus = parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""));
            // 原本滿的，有人退選，而且舊課程沒有鎖定，就加上鎖定狀態
            if (oldStatus && !newStatus && oldStatus_lock) {
                var nowTime = Date.now();
                allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].lock = true;
                allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].startTime = nowTime;
            }
            if (allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].startTime != 0) {
                var activeTime = Date.now() - allOtherClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].startTime;
                // 大於6小時，清空
                if (activeTime >= 6 * 60 * 60 * 1000) {
                    allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].startTime = 0;
                    allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "")].lock = false;
                }
            }
        }
        // console.log(allClass)
        db.ref("/other/allClass").update(
            allClass
        ).then(function () {
            console.log("other update");
            timerForGet = setInterval(getAllOtherClass, 60 * 1000);
        }).catch(function () {
            console.log("some error");
            timerForGet = setInterval(getAllOtherClass, 60 * 1000);
        });
    });
}

function getAllSportClass() {
    clearTimeout(timerForGetS);
    request({
        url: "https://ccweb.ncnu.edu.tw/student/aspmaker_course_opened_detail_viewlist.php?cmd=search&t=aspmaker_course_opened_detail_view&x_year=1071&x_deptid=90&recperpage=200",
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            res.status(404).send("some errors");
            return;
        }
        var $ = cheerio.load(body);

        var allClass = {};

        // ID 選擇
        for (var i = 1; i <= 34; i++) {
            allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"] = {
                limit: $("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""),
                seleced_no: $("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", ""),
                teacher: $("#el" + i + "_aspmaker_course_opened_detail_view_teachers>span").text().replace("\n", ""),
                time: $("#el" + i + "_aspmaker_course_opened_detail_view_time>span").text().replace("\n", ""),
                place: $("#el" + i + "_aspmaker_course_opened_detail_view_place>span").text().replace("\n", ""),
                fill: parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", "")),
                lock: allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].lock,
                startTime: allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].startTime
            };
            // 某課程舊資料是否是滿的
            var oldStatus = allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].fill == true;
            var oldStatus_lock = allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].lock == false;
            // 某課程新資料是否是滿的
            var newStatus = parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_seleced_no>span").text().replace("\n", "")) == parseInt($("#el" + i + "_aspmaker_course_opened_detail_view_limit>span").text().replace("\n", ""));
            // 原本滿的，有人退選，而且舊課程沒有鎖定，就加上鎖定狀態
            if (oldStatus && !newStatus && oldStatus_lock) {
                var nowTime = Date.now();
                allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].lock = true;
                allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].startTime = nowTime;
            }
            if (allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].startTime != 0) {
                var activeTime = Date.now() - allSportClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].startTime;
                // 大於6小時，清空
                if (activeTime >= 6 * 60 * 60 * 1000) {
                    allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].startTime = 0;
                    allClass[$("#el" + i + "_aspmaker_course_opened_detail_view_cname>span").text().replace("\n", "") + "(" + i + ")"].lock = false;
                }
            }
        }
        // console.log(allClass)
        db.ref("/sport/allClass").update(
            allClass
        ).then(function () {
            console.log("sport update");
            timerForGetS = setInterval(getAllSportClass, 60 * 1000);
        }).catch(function () {
            console.log("some error");
            timerForGetS = setInterval(getAllSportClass, 60 * 1000);
        });
    });
}