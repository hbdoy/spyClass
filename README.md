# spyClass
## About
此程式負責爬取課程選課人數，並在發現有課程的狀態為滿人時，監控是否有額滿後的釋出名額，若有則記錄當下時間，作為鎖定時間 6hr 的計算。

Frontend Repo : https://github.com/hbdoy/ncnu-class-info

view : https://hbdoy.github.io/ncnu-class-info/

## 使用技術
- [NodeJs](https://nodejs.org/en/)

DB
- [firebase](https://firebase.google.com/)

## 運作流程
後端爬蟲不斷更新資料到 => firebase <= 前端從 firebase 中撈取結果
