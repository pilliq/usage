from pymongo import MongoClient
from dateutil.relativedelta import relativedelta
from datetime import datetime
from flask import Flask
from flask import g
from bson import json_util
import pymongo
import flask
import simplejson as json
import functools
import locale

app = Flask(__name__)

def with_db(method):
    @functools.wraps(method)
    def wrapper(*args, **kwargs):
        if not hasattr(g, 'mongo'):
            g.mongo = MongoClient('localhost', 30000)
        result = method(*args, **kwargs)
        g.mongo.close()
        return result
    return wrapper

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/monthly')
@with_db
def monthly():
    return json.dumps([x for x in g.mongo.mongousage["gen.monthly"].find().sort("_id", pymongo.DESCENDING)])

@app.route('/weekly')
@with_db
def weekly():
    return json.dumps([x for x in g.mongo.mongousage['gen.weekly'].find().sort('_id', pymongo.DESCENDING)])

@app.route('/os')
@with_db
def os():
    os = []
    for i in g.mongo.mongousage['gen.firstPiece.day7'].find().sort('value', pymongo.DESCENDING):
        bad = False
        for j in ('.', '-', 'log', 'stats'):
            if i['_id'].find(j) >= 0:
                bad = True
                break
        if bad:
            continue
        os.append(i)
    return json.dumps(os)

@app.route('/os_monthly')
@with_db
def os_monthly():
    return json.dumps([x for x in g.mongo.mongousage['gen.monthly.os'].find().sort('_id', pymongo.DESCENDING)])

@app.route('/versions')
@with_db
def versions():
    return json.dumps([x for x in g.mongo.mongousage['gen.monthly.version'].find().sort('_id', pymongo.DESCENDING)], default=json_util.default)

@app.route('/numbers')
def numbers():
    return flask.render_template('numbers.html')

@app.route('/viz')
def viz():
    return flask.render_template('viz.html')

@app.route('/pie_viz')
def pie_viz():
    return flask.render_template('pie_viz.html')

@app.route('/line_viz')
def line_viz():
    return flask.render_template('line_viz.html')

@app.route('/stack')
def stack():
    return flask.render_template('stack.html')

@app.route('/email_template')
@with_db
def email_template():
    def get_point(data, date):
        for d in data:
            if datetime.strptime(d['_id'], '%Y-%m') == date:
                return d

    def i(d):
        locale.setlocale(locale.LC_ALL, 'en_US')
        return locale.format("%d", d, grouping=True)

    def f(i):
        return "{0:.2f}%".format(i * 100)

    monthly = [x for x in g.mongo.mongousage["gen.monthly"].find().sort("_id", pymongo.DESCENDING)]
    now = datetime(2013, 12, 1)
    previous = now - relativedelta(months=1)
    now_point = get_point(monthly, now)
    previous_point = get_point(monthly, previous)

    projected_total = previous_point['value']['total'] + 1000
    projected_unique = previous_point['value']['unique'] + 1000

    total_change_value = projected_total - previous_point['value']['total']
    total_change_percent = float(total_change_value) / float(previous_point['value']['total'])

    unique_change_value = projected_unique - previous_point['value']['unique']
    unique_change_percent = float(unique_change_value) / float(previous_point['value']['unique'])

    if total_change_value > 0:
        total_change = 2
    elif total_change_value < 0:
        total_change = 1
    else:
        total_change = 0

    if unique_change_value > 0:
        unique_change = 2
    elif unique_change_value < 0:
        unique_change = 1
    else:
        unique_change = 0


    return flask.render_template('email_template.html',
                                 previous_date = previous,
                                 current_date = now,
                                 previous_total=i(previous_point['value']['total']),
                                 projected_total=i(projected_total),
                                 total_change_value=i(abs(total_change_value)),
                                 total_change_percent=f(total_change_percent),
                                 previous_unique=i(previous_point['value']['unique']),
                                 projected_unique=i(projected_unique),
                                 unique_change_value=i(abs(unique_change_value)),
                                 unique_change_percent=f(unique_change_percent),
                                 current_total=i(now_point['value']['total']),
                                 current_unique=i(now_point['value']['unique']),
                                 total_change=total_change,
                                 unique_change=unique_change,
    )

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=8000)
