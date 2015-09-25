// API 來的資料是：
//   "1": [0, 0.5, 1, 1.5, 2, 2.5, 5, 5.5, 6],
//   "2": [8, 8.5, 9, 9.5]
//
// 透過 python 轉成：
//   { "1": ["00:00~02:30", "05:00~06:00"] }
// 就可以依此資料組出 checkbox + selectbox
//
// 而送出的時候，則在後端再組出如 [0, 0.5] 的資料。
// 不過問題在於重疊或什麼的問題
//
// 還是 selectbox 的 option 顯示是 02:30，
// 但 value 是 2.5 呢？
//
// 假設 今天選了
// Monday 08:00 ~ 14:00
// Monday 18:00 ~ 23:30
//
// 那麼送出時，會送出這樣的 JSON:
// {
//   "1": [8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5]
// }
//
// 結束時間 02:30 的話，該 select 的 option 起始時間會從
// 02:30 開始增長至 隔日 02:30
//
// 顯示的規則是這樣
// 若今日有到 24:00，且隔日從 0:00 開始，一直到 12:00 之前（不含）的話，就把跨日時間顯示在「今日」。

var weekday = {
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday',
  '7': 'sunday'
};

function paddy(n, p, c) {
  var pad_char = typeof c !== 'undefined' ? c : '0';
  var pad = new Array(1 + p).join(pad_char);
  return (pad + n).slice(-pad.length);
}

function floatToTime(value, isCrossDay) {
  var isFloat = value.toString().indexOf(".") > -1;
  if (isCrossDay) {
    if (value > 24) {
      value -= 24;
    }
  }

  if (isFloat) {
    value = value.toString().replace(/\.5/g, ":30");
  } else {
    value = value + ":00";
  }

  return value;
}

function timeToFloat(value) {
  value = value.replace(":30", ".5");
  value = value.replace(":00", "");

  return +value;
}

function generateTimePeriod(start, isStart) {
  var options = "";

  for (var i = start, max = (isStart) ? (24 + start) : (24 + start - 0.5); i <= max; i += 0.5) {
    if (i > 24) {
      options += "<option value='" + i + "'>隔天 " + floatToTime(i, true) + "</option>";
    } else {
      options += "<option value='" + i + "'>" + floatToTime(i) + "</option>";
    }
  }

  return options;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

function sortNumber(a, b) {
  return a - b;
}

function getRanges(array) {
  var ranges = [], rstart, rend;
  for (var i = 0; i < array.length; i++) {
    rstart = array[i];
    rend = rstart;
    while (array[i + 1] - array[i] === 0.5) {
      rend = array[i + 1]; // increment the index if the numbers sequential
      i++;
    }
    ranges.push(rstart == rend ? rstart+'' : rstart + '-' + rend);
  }
  return ranges;
}

function renderButtons() {
  $(".weekday").each(function (i, v) {
    var len = $(".timepickerWrapper", $(this)).length;
    if (len === 1) {
      $(".js-remove-timepicker", $(this)).hide();
      $(".js-add-timepicker", $(this)).show();
    } else if (len >= 2) {
      $(".js-remove-timepicker", $(this)).show();
      $(".js-add-timepicker", $(this)).hide();
    }
  });
}



function renderTimePickers(state) {
  var htmlFragment = '';
  var basicFragment = $("#timepickerTmpl").html();

  for (var key in state) {
    var selectedTimeArr = state[key];
    var selectedSet1Arr = [];
    var selectedSet2Arr = [];
    var selectedSet3Arr = [];

    if (selectedTimeArr.length === 0) {
      htmlFragment = "<div class='timePicker'>";
      htmlFragment += basicFragment;
      htmlFragment = htmlFragment.replace(/\{weekday\}/g, weekday[key].toLowerCase());
      htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
      htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(0.5), false);

      $(htmlFragment).appendTo(".weekday-" + weekday[key]);
    } else {
      selectedSet1Arr = selectedTimeArr[0].split("~");

      htmlFragment = "<div class='timePicker'>";
      htmlFragment += basicFragment;
      htmlFragment = htmlFragment.replace(/\{weekday\}/g, weekday[key].toLowerCase());
      htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
      htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(+timeToFloat(selectedSet1Arr[0]) + 0.5), false);

      if (selectedTimeArr.length === 2) {
        selectedSet2Arr = selectedTimeArr[1].split("~");
        htmlFragment += basicFragment;
        htmlFragment = htmlFragment.replace(/\{weekday\}/g, key);
        htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
        htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(+timeToFloat(selectedSet2Arr[0]) + 0.5, false));
      }

      if (selectedTimeArr.length === 3) {
        selectedSet2Arr = selectedTimeArr[1].split("~");
        htmlFragment += basicFragment;
        htmlFragment = htmlFragment.replace(/\{weekday\}/g, key);
        htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
        htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(+timeToFloat(selectedSet2Arr[0]) + 0.5, false));

        selectedSet3Arr = selectedTimeArr[2].split("~");
        htmlFragment += basicFragment;
        htmlFragment = htmlFragment.replace(/\{weekday\}/g, key);
        htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
        htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(+timeToFloat(selectedSet3Arr[0]) + 0.5, false));
      }

      htmlFragment += "</div>";

      $(htmlFragment).appendTo(".weekday-" + weekday[key]);

      $('.weekday-' + weekday[key] + ' .timePicker select:eq(0)').val(timeToFloat(selectedSet1Arr[0]));
      $('.weekday-' + weekday[key] + ' .timePicker select:eq(1)').val(timeToFloat(selectedSet1Arr[1]));

      if (selectedTimeArr.length === 2) {
        $('.weekday-' + weekday[key] + ' .timePicker select:eq(2)').val(timeToFloat(selectedSet2Arr[0]));
        $('.weekday-' + weekday[key] + ' .timePicker select:eq(3)').val(timeToFloat(selectedSet2Arr[1]));
      }

      if (selectedTimeArr.length === 3) {
        $('.weekday-' + weekday[key] + ' .timePicker select:eq(2)').val(timeToFloat(selectedSet2Arr[0]));
        $('.weekday-' + weekday[key] + ' .timePicker select:eq(3)').val(timeToFloat(selectedSet2Arr[1]));

        $('.weekday-' + weekday[key] + ' .timePicker select:eq(4)').val(timeToFloat(selectedSet3Arr[0]));
        $('.weekday-' + weekday[key] + ' .timePicker select:eq(5)').val(timeToFloat(selectedSet3Arr[1]));
      }
    }
  }
}

$(function (){

  renderTimePickers(state);
  renderButtons();


  // ============================
  // checkbox handler
  // ============================
  $(".chkWeekday").on("click", function (e) {
    var $timePicker = $(this).parent().parent().find(".timePicker");
    if (e.target.checked) {
      $timePicker.show();
    } else {
      $timePicker.hide();
    }
  });

  for (var k in state) {
    if (state[k].length > 0) {
      $(".chk" + capitalizeFirstLetter(weekday[k])).trigger("click");
    }
  }


  // ============================
  // timepicker onchange handler
  // ============================
  $(".weekday").on("change", ".timepicker-start", function (e) {
    var result = e.target.value;
    $(this).parent().find(".timepicker-end").html(generateTimePeriod(+result + 0.5, false));
  });


  // ============================
  // Add timepicker
  // ============================
  $(".weekday").on("click", ".js-add-timepicker", function (e) {
    var basicFragment = $("#timepickerTmpl").html();
    var htmlFragment = "";
    htmlFragment += basicFragment;
    htmlFragment = htmlFragment.replace(/\{weekday\}/g, $(this).parent().parent().parent().attr("class").split(" ")[1].replace("weekday-", ""));
    htmlFragment = htmlFragment.replace(/\{options\-start\}/g, generateTimePeriod(0, true));
    htmlFragment = htmlFragment.replace(/\{options\-end\}/g, generateTimePeriod(0.5), false);
    $(htmlFragment).appendTo($(this).parent().parent());
    renderButtons();
  });


  // ============================
  // Remove timepicker
  // ============================
  $(".weekday").on("click", ".js-remove-timepicker", function (e) {
    $(this).parent().remove();
    renderButtons();
  });


  // ============================
  // Change time picker mode
  // ============================
  $(".js-change-timeperiod").on("change", function (e) {
    if ($(this).val() === "24h") {
      $(".weekday").each(function (i, v) {
        $(".timePicker", $(this)).empty();
      });
      $(".chkWeekday").prop("checked", false);

      var state = {
        "1": ["00:00~24:00"],
        "2": ["00:00~24:00"],
        "3": ["00:00~24:00"],
        "4": ["00:00~24:00"],
        "5": ["00:00~24:00"],
        "6": ["00:00~24:00"],
        "7": ["00:00~24:00"]
      };
      renderTimePickers(state);
      renderButtons();
      $(".chkWeekday").trigger("click");
      $(".weekdayList").hide();
    } else {
      $(".weekdayList").show();
    }
  });


  // ============================
  // generate final JSON
  // ============================
  $(".js-submit").on("click", function (e) {
    var timePeriodObj = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
      '6': [],
      '7': []
    };
    var weekdayTimePeriod;
    var url = $(".form").data("url");

    $(".weekday").each(function (i, v) {
      weekdayTimePeriod = [];
      if ($(".chkWeekday:checked", $(this)).length > 0) {
        $(".timepickerWrapper", $(this)).each(function (i2, v2) {
          var startVal = +$(".timepicker-start", $(this)).val(),
            endVal = +$(".timepicker-end", $(this)).val();

          for (var j = startVal; j <= endVal; j += 0.5) {
            weekdayTimePeriod.push(j);
          }
        });

        timePeriodObj[i + 1] = uniq(weekdayTimePeriod.sort(sortNumber));
      }
    });

    console.log(timePeriodObj);

    // ===================================
    // 把 > 24 的隔日資料搬移到隔日的 array
    // ===================================
    var tmpArr = [];
    for (var w = 1, wmax = 8; w <= wmax; w++) {
      console.log(w);
      if (tmpArr.length > 0) {
        tmpArr.push(24);
        for (var i = 0, m = tmpArr.length; i < m; i++) {
          tmpArr[i] = tmpArr[i] - 24;
        }

        if (w === 8) {
          timePeriodObj[1] = uniq(timePeriodObj[1].concat(tmpArr).sort(sortNumber));
          break;
        } else {
          timePeriodObj[w] = uniq(timePeriodObj[w].concat(tmpArr).sort(sortNumber));
        }
        tmpArr = [];
      }

      for (var s = 0, max = timePeriodObj[w].length; s < max; s++) {
        if (timePeriodObj[w][s] > 24) {
          tmpArr.push(timePeriodObj[w][s]);
        }
      }

      timePeriodObj[w] = $.grep(timePeriodObj[w], function (value) {
        return tmpArr.indexOf(value) === -1;
      });
    }
    // console.log(timePeriodObj);

    $.ajax({
      url: url,
      method: "POST",
      data: {
        data: JSON.stringify(timePeriodObj)
      }
    }).done(function (response, status, xhr) {
      if (response === '1') {
        window.location.href = '/';
      } else {
        alert("failed...");
      }
    }).fail(function (xhr, status, error) {
      console.log(error);
      alert("failed...");
    });

//     for (var p in timePeriodObj) {
//       console.log(getRanges(timePeriodObj[p]));
//     }
  });
});
