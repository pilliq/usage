from pymongo import MongoClient
from flask import Flask
from flask import g
from bson import json_util
import pymongo
import flask
import simplejson as json
import functools

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

@app.route('/viz')
def viz():
    return flask.render_template('viz.html')

@app.route('/pie_viz')
def pie_viz():
    return flask.render_template('pie_viz.html')

@app.route('/stack')
def stack():
    return flask.render_template('stack.html')

@app.route('/email_template')
def email_template():
    return flask.render_template('email_template.html')

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=8080)
