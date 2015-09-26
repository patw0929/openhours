from flask import Flask, render_template, request, redirect, url_for, session

from collections import OrderedDict

import decimal
import random
import json
import numpy
import copy

app = Flask(__name__)
app.secret_key = '|\\V\xc9*\xa9\xc1;]\x03\xecH/Y\x9d\xeeu\xab:t\x96\x8f$\x8b'


def format_number(num):
    try:
        dec = decimal.Decimal(num)
    except:
        return 'bad'
    tup = dec.as_tuple()
    delta = len(tup.digits) + tup.exponent
    digits = ''.join(str(d) for d in tup.digits)
    if delta <= 0:
        zeros = abs(tup.exponent) - len(tup.digits)
        val = '0.' + ('0'*zeros) + digits
    else:
        val = digits[:delta] + ('0'*tup.exponent) + '.' + digits[delta:]
    val = val.rstrip('0')
    if val[-1] == '.':
        val = val[:-1]
    if tup.sign:
        return '-' + val
    return val


def _convert_float_time(time):
    from datetime import datetime
    import numbers

    if isinstance(time, numbers.Integral):
        time = str(time) + ":00"
    else:
        time = str(time).replace(".5", ":30").replace(".0", ":00")

    if time == "24:00":
        time = "00:00"

    d = datetime.strptime(time, "%H:%M")
    return str(d.strftime("%H:%M"))


def GroupRanges(items):
    """Yields 2-tuples of (start, end) ranges from a sequence of numbers.

    Args:
      items: an iterable of numbers, sorted ascendingly and without duplicates.

    Yields:
      2-tuples of (start, end) ranges.  start and end will be the same
      for ranges of 0.5 number
    """
    myiter = iter(items)
    start = myiter.next()
    end = start
    for num in myiter:
        if num == end + 0.5:
            end = num
        else:
            yield (start, end)
            start = num
            end = num
    yield (start, end)


@app.route('/')
def display():
    if 'openingHours' not in session:
        # testing data
        openingHours = {
            '1': [7, 7.5, 8, 22.5, 23, 23.5, 24],
            '2': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 8, 8.5, 9]
        }
    else:
        openingHours = session.get('openingHours', {})

    displayOpeningHours = OrderedDict(sorted(
        copy.deepcopy(openingHours).items(), key=lambda t: t[0]))

    period = {}
    for k in openingHours:
        flag = 0
        period[k] = list(GroupRanges(openingHours[k]))

    period = OrderedDict(sorted(period.items(), key=lambda t: t[0]))

    for k in period:
        flag = 0
        tmpArr = []
        if int(k) - 1 > 0:
            if str(int(k) - 1) in period:
                for i, j in period[str(int(k) - 1)]:
                    if j == 24:
                        flag += 1

                for m, n in period[k]:
                    if m == 0 and n < 12:
                        tmpArr = numpy.arange(m, n + 0.5, 0.5)
                        flag += 1

                if flag == 2:
                    displayOpeningHours[k] = sorted(
                        list(set(openingHours[k]).difference(tmpArr)))

                    tmpArr[:] = [x + 24 for x in tmpArr]
                    displayOpeningHours[str(int(k) - 1)].extend(tmpArr)
                    displayOpeningHours[str(int(k) - 1)] = sorted(
                        list(set(displayOpeningHours[str(int(k) - 1)])))
        elif int(k) == 1:
            if '7' in period:
                for i, j in period['7']:
                    if j == 24:
                        flag += 1

                for m, n in period[k]:
                    if m == 0 and n < 12:
                        tmpArr = numpy.arange(m, n + 0.5, 0.5)
                        flag += 1

                if flag == 2:
                    displayOpeningHours[k] = sorted(
                        list(set(openingHours[k]).difference(tmpArr)))

                    tmpArr[:] = [x + 24 for x in tmpArr]
                    displayOpeningHours['7'].extend(tmpArr)
                    displayOpeningHours['7'] = sorted(
                        list(set(displayOpeningHours['7'])))

    result = {}
    for k in displayOpeningHours:
        result[k] = []
        timePeriod = list(GroupRanges(displayOpeningHours[k]))
        for i, j in timePeriod:
            if i > 24:
                i -= 24
            if j > 24:
                j -= 24

            result[k].append(_convert_float_time(i) + "~" +
                             _convert_float_time(j).replace("00:00", "24:00"))

    result = OrderedDict(sorted(result.items(), key=lambda t: t[0]))

    return render_template("views.html",
                           result=result)


@app.route('/form', methods=['GET', 'POST'])
def form():
    if request.method == 'POST':
        try:
            openingHours = request.form.get('data')
            session['openingHours'] = dict(json.loads(openingHours))
            return '1'
        except:
            raise
            return '0'

    prefilledData = {}
    if 'openingHours' in session:
        prefilledData = session.get('openingHours', {})

    period = OrderedDict(sorted({
        '1': [],
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': [],
        '7': []
        }.items(), key=lambda t: t[0]))
    result = OrderedDict(sorted({
        '1': [],
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': [],
        '7': []
        }.items(), key=lambda t: t[0]))

    for k in prefilledData:
        flag = 0
        period[k] = sorted(list(set(prefilledData[k])))
        period[k] = list(GroupRanges(period[k]))
        result[k] = []
        for i, j in period[k]:
            if i > 24:
                i -= 24
            if j > 24:
                j -= 24

            result[k].append(_convert_float_time(i) + "~" +
                             _convert_float_time(j).replace("00:00", "24:00"))

    return render_template("form.html", prefilledData=result)


if __name__ == '__main__':
    app.run(debug=True)
