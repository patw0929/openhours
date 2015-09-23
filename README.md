Opening Hours 營業時間表單與解析
---

## 說明

設定營業時間的 POC (Proof of Concept)。

使用了 jQuery, Python/Flask。

只是概念驗證，故請無視很亂的程式碼 :see_no_evil: :hear_no_evil: :speak_no_evil:


## 顯示邏輯

* 每 **半小時** 為一個單位。
* 起始時間不得大於結束時間。
* 表單可選取跨日的時間，而跨日可選的時間，是從 **開始時間** 起算 24 小時。
* 顯示頁顯示時，若今日有到 24:00，且隔日從 0:00 開始，一直到 12:00 之前（不含）的話，就把跨日時間顯示在「今日」。
* 跨日的資料送出後，再次回到表單，跨日時間是會被拆開至兩日的。例如星期一 20:00 跨日到星期二的 02:30，再次進入表單編輯時，會顯示成星期一的 20:00~24:00，及星期二的 0:00~02:30。
* 表單上單日的時間下拉選單一般情況下最多可設定兩組（透過 `+` 按鈕增加），但若剛好有跨日的時間，則至多會顯示三組時間區間。
* 情境上後端拿到的資料是這樣子的 JSON：

  ```javascript
  {
    "1": [0, 0.5, 1, 1.5, 2, 2.5, 5, 5.5, 6],
    "2": [8, 8.5, 9, 9.5],
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": []
  }
  ```


## 執行

先安裝 pip 套件：

```bash
virtualenv env
. env/bin/activate
pip install -r requires.txt
```

啟動

```bash
python openhour.py
```

接著訪問 [http://localhost:5000/](http://localhost:5000/)


## Screenshots

![form](http://i.imgur.com/GwhgaxF.png)

![data](http://i.imgur.com/YWvTVVK.png)


## License

MIT


## Author

[patw](http://patw.me)
