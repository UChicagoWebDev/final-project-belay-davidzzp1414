# This project relied on free resources from the internet for implemententing the functionalities
# of displaying images and emojis

import string
import random
from datetime import datetime
from flask import *
from functools import wraps
import sqlite3
import traceback

app = Flask(__name__)
app.secret_key = 'davidzhang_secret_key'


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def render_with_error_handling(template, **kwargs):
    try:
        return render_template(template, **kwargs)
    except:
        t = traceback.format_exc()
        return render_template('error.html', args={"trace": t}), 500

def new_user(name, password):
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

def get_user_from_cookie(request):
    user_id = request.cookies.get('davidzhang_user_id')
    password = request.cookies.get('davidzhang_user_password')
    if user_id and password:
        return query_db('select * from users where id = ? and password = ?', [user_id, password], one=True)
    return None


########  Page Rendering  ########
@app.route('/login')
def render_login():
    user = get_user_from_cookie(request)
    if user is not None:
        print('Current session already logged in')
        next_page = session.pop('next', None)
        if next_page:
            return redirect(next_page)
        else:
            return redirect('/')
    return render_with_error_handling('page.html', user=user)

@app.route('/profile')
def render_profile():
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_profile')
        return redirect('/login')
    return render_with_error_handling('page.html', user=user)

@app.route('/')
def render_home():
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_home')
        return redirect('/login')
    return render_with_error_handling('page.html', user=user)

@app.route('/channel/<int:channel_id>')
def render_channel(channel_id):
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_channel', channel_id=channel_id)
        return redirect('/login')
    return render_with_error_handling('page.html', user=user)

@app.route('/channel/<int:channel_id>/thread/<int:thread_id>')
def render_thread(channel_id, thread_id):
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_thread', channel_id=channel_id, thread_id=thread_id)
        return redirect('/login')
    return render_with_error_handling('page.html', user=user)

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404


########  API  ########
def verify_api(request):
    try:
        user = get_user_from_cookie(request)
        key = request.headers.get('x-api-key')
        db_key = query_db("select api_key from users where id = ?",
                        [user['id']], one=True)['api_key']
        if key == db_key:
            return True
        else:
            return jsonify({"error": "unauthorized API key"}), 406
    except:
        return jsonify({"error": "unauthorized API key"}), 406

def get_unread_num(channel, user):
    last_message = query_db('''
select message_id from users_messages where user_id = ? and channel_id = ?
                                    ''', [user['id'], channel['id']], one=True)
    if last_message is None:
        last_message_id = -1
    else:
        last_message_id = last_message['message_id']
    unread_messages = query_db('''
select distinct(messages.id) from messages
where messages.channel_id = ? and messages.id > ?
                            ''', [channel['id'], last_message_id])
    if unread_messages is None:
        return 0
    else:
        return len(unread_messages)

@app.route('/api/get_channels_list', methods=['GET'])
def get_channels_list():
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)
    channels = query_db('''
select id, name from channels
                        ''')
    if channels is None:
        return jsonify('No channels')
    else:
        return jsonify([{'id': channel['id'], 'name': channel['name'], 'unread': get_unread_num(channel, user)}
                        for channel in channels])

@app.route('/api/get_channel_name/<int:channel_id>', methods=['GET'])
def get_channel_name(channel_id):
    if verify_api(request) is not True:
        return verify_api(request)
    result = query_db('''
select name from channels
where id = ?
                        ''', [channel_id], one=True)
    if result is None:
        return jsonify('Check your channel ID')
    else:
        return jsonify('# '+result['name'])

def get_reply_count(msg):
    replies = query_db('''
select distinct(id) from messages where reply_to = ?
                       ''', [msg['message_id']])
    if replies is None:
        return 0
    else:
        return len(replies)

def e_cnt(msg):
    emojis = [0, 0, 0]
    e1 = query_db('''
select * from emojis where message_id = ? and emoji = "&#x1F600;"
                  ''', [msg['message_id']])
    if e1:
        emojis[0] = len(e1)
    e2 = query_db('''
select * from emojis where message_id = ? and emoji = "&#x1F601;"
                  ''', [msg['message_id']])
    if e2:
        emojis[1] = len(e2)
    e3 = query_db('''
select * from emojis where message_id = ? and emoji = "&#x1F602;"
                  ''', [msg['message_id']])
    if e3:
        emojis[2] = len(e3)
    return emojis

def rs(msg):
    reacters = ['', '', '']
    r1 = query_db('''
select users.name as name from emojis
inner join users on emojis.user_id = users.id
where emojis.message_id = ? and emoji = "&#x1F600;"
                  ''', [msg['message_id']])
    if r1:
        reacters[0] = ', '.join([r['name'] for r in r1])
    r2 = query_db('''
select users.name as name from emojis
inner join users on emojis.user_id = users.id
where message_id = ? and emoji = "&#x1F601;"
                  ''', [msg['message_id']])
    if r2:
        reacters[1] = ', '.join([r['name'] for r in r2])
    r3 = query_db('''
select users.name as name from emojis
inner join users on emojis.user_id = users.id
where message_id = ? and emoji = "&#x1F602;"
                  ''', [msg['message_id']])
    if r3:
        reacters[2] = ', '.join([r['name'] for r in r3])
    return reacters

@app.route('/api/get_messages/<int:channel_id>', methods=['GET'])
def get_messages(channel_id):
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)
    result = query_db('''
select users.name as user_name, body, messages.id as message_id
from messages
inner join users on messages.user_id = users.id
where messages.channel_id = ? and reply_to is null
                        ''', [channel_id])
    if result is None:
        return jsonify('No messages yet')
    else:
        last_message = query_db('''
select * from messages
where channel_id = ?
order by id desc limit 1
                                   ''', [channel_id], one=True)
        print(last_message['id'], last_message['body'])
        if last_message is not None:
            if query_db('select * from users_messages where user_id = ? and channel_id = ?',
                        [user['id'], channel_id], one=True) is not None:
                query_db('''
update users_messages set message_id = ?
where user_id = ? and channel_id = ?
                        ''', [last_message['id'], user['id'], channel_id])
            else:
                query_db('''
insert into users_messages (user_id, message_id, channel_id) values (?, ?, ?)
                        ''', [user['id'], last_message['id'], channel_id])
        return jsonify([{'id': msg['message_id'], 'user_name': msg['user_name'], 'body': msg['body'], 'replies': get_reply_count(msg), 'channel_id': channel_id,
                         'e1': e_cnt(msg)[0], 'e2': e_cnt(msg)[1], 'e3': e_cnt(msg)[2], 'reacters1': rs(msg)[0], 'reacters2': rs(msg)[1], 'reacters3': rs(msg)[2]}
                        for msg in result])

@app.route('/api/get_message/<int:thread_id>', methods=['GET'])
def get_message(thread_id):
    if verify_api(request) is not True:
        return verify_api(request)
    result = query_db('''
select users.name as user_name, body, messages.id as message_id
from messages
inner join users on messages.user_id = users.id
where messages.id = ?
                        ''', [thread_id])
    if result is None:
        return jsonify('No messages yet')
    else:
        return jsonify([{'id': msg['message_id'], 'user_name': msg['user_name'], 'body': msg['body'], 'replies': get_reply_count(msg),
                         'e1': e_cnt(msg)[0], 'e2': e_cnt(msg)[1], 'e3': e_cnt(msg)[2], 'reacters1': rs(msg)[0], 'reacters2': rs(msg)[1], 'reacters3': rs(msg)[2]}
                        for msg in result])

@app.route('/api/get_replies/<int:channel_id>/<int:thread_id>', methods=['GET'])
def get_replies(channel_id, thread_id):
    if verify_api(request) is not True:
        return verify_api(request)
    result = query_db('''
select users.name as user_name, body, messages.id as message_id
from messages
inner join users on messages.user_id = users.id
where messages.channel_id = ? and reply_to = ?
                        ''', [channel_id, thread_id])
    if result is None:
        return jsonify('No messages yet')
    else:
        return jsonify([{'id': msg['message_id'], 'user_name': msg['user_name'], 'body': msg['body'], 'replies': get_reply_count(msg), 'channel_id': channel_id,
                         'e1': e_cnt(msg)[0], 'e2': e_cnt(msg)[1], 'e3': e_cnt(msg)[2], 'reacters1': rs(msg)[0], 'reacters2': rs(msg)[1], 'reacters3': rs(msg)[2]}
                        for msg in result])

@app.route('/api/post_reply/<int:channel_id>/<int:thread_id>', methods=['POST'])
def post_reply(channel_id, thread_id):
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)

    user_id = user['id']
    reply = request.json.get('reply')
    if not reply:
        return jsonify({'error': 'No reply provided'}), 405
    query = """
insert into messages (user_id, channel_id, reply_to, body) values (?, ?, ?, ?)
            """
    query_db(query, [user_id, channel_id, thread_id, reply], one=True)
    print('new reply inserted to DB')
    return jsonify({'success': True})

@app.route('/api/post_message/<int:channel_id>', methods=['POST'])
def post_message(channel_id):
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)

    user_id = user['id']
    message = request.json.get('message')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 405
    query = """
insert into messages (user_id, channel_id, reply_to, body) values (?, ?, null, ?)
            """
    query_db(query, [user_id, channel_id, message], one=True)
    print('new message inserted to DB')
    return jsonify({'success': True})

@app.route('/api/post_emoji/<int:message_id>', methods=['POST'])
def post_emoji(message_id):
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)
    
    user_id = user['id']
    emoji_code = request.json.get('emoji_code')
    if query_db('''
select * from emojis
where user_id=? and message_id=? and emoji=?
                ''', [user_id, message_id, emoji_code]) is not None: # already posted emoji
        query_db('''
delete from emojis
where user_id=? and message_id=? and emoji=?
                 ''', [user_id, message_id, emoji_code]) # delete reaction
    else:
        query_db('''
insert into emojis (user_id, message_id, emoji)
values (?, ?, ?)
                 ''', [user_id, message_id, emoji_code]) # add reaction
    return jsonify({'success': True})

@app.route('/api/login', methods=['GET'])
def login():
    name = request.headers.get('username')
    password = request.headers.get('password')

    query = """
select id from users where name = ? and password = ?
            """
    result = query_db(query, [name, password], one=True)
    if result is None:
        print('user not in db')
        return jsonify('User not identified')

    next_page = session.pop('next', None)
    if next_page:
        print(str(next_page))
        resp = make_response(jsonify({'redirectUrl': next_page}))
    else:
        resp = make_response(jsonify({'redirectUrl': url_for('render_home')}))
    resp.set_cookie('davidzhang_user_id', str(result['id']))
    resp.set_cookie('davidzhang_user_password', str(password))
    return resp

@app.route('/api/signup', methods=['POST'])
def signup():
    name = request.json.get('username')
    password = request.json.get('password')
    try:
        user = new_user(name, password)
        next_page = session.pop('next', None)
        if next_page:
            print(str(next_page))
            resp = make_response(jsonify({'redirectUrl': next_page}))
        else:
            resp = make_response(jsonify({'redirectUrl': url_for('render_home')}))
        resp.set_cookie('davidzhang_user_id', str(user['id']))
        resp.set_cookie('davidzhang_user_password', str(user['password']))
        return resp
    except:
        return jsonify('Invalid username')

@app.route('/api/profile', methods=['POST'])
def update_profile():
    user = get_user_from_cookie(request)
    if verify_api(request) is not True:
        return verify_api(request)
    
    user_id = user['id']
    new_name = request.headers.get('username')
    new_password = request.headers.get('password')
    if not new_name:
        return jsonify({'error': 'No username provided'}), 400
    if query_db('select * from users where name = ?', [new_name], one=True) is not None:
        return jsonify('Username already exists')
    else:
        query = """
    update users set name = ?, password = ?
    where id = ?
                """
        result = query_db(query, [new_name, new_password, user_id], one=True)
        print('profile updated')
        resp = make_response(jsonify({'redirectUrl': url_for('render_profile')}))
        resp.set_cookie('davidzhang_user_password', str(new_password))
        return resp

@app.route('/api/logout', methods=['GET'])
def logout():
    if verify_api(request) is not True:
        return verify_api(request)
    
    resp = make_response(jsonify({'redirectUrl': url_for('render_login')}))
    resp.set_cookie('davidzhang_user_id', '')
    resp.set_cookie('davidzhang_user_password', '')
    return resp


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
