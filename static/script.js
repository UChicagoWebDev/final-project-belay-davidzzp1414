PATH_LIST = new URL(window.location.href).pathname.split('/');
MESSAGES_INTERVAL = 500;
CHANNELS_INTERVAL = 500;
WINDOW_WIDTH_CUTOFF = 1000;


function show_page(page) {
    //console.log(console.log('show'.concat(' ', page)));
    document.getElementById(page).style.display = "";
}
function hide_page(page) {
    //console.log(console.log('hide'.concat(' ', page)));
    document.getElementById(page).style.display = "none";
}
function expand_page(page) {
    document.getElementById(page).style.width = "100vw";
}


// login
function login() {
    fetch('/api/login', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "username": document.getElementById('login_username').value,
            "password": document.getElementById('login_password').value
          }
    })
    .then(response => response.json())
    .then(result => {
        if (result == 'User not identified') {
            show_page('login_error');
        } else {
            hide_page('login_error');
            window.location.href = result.redirectUrl;
        }
    })
    .catch(error => {
        console.error(error);
    });
}
function signup() {
    const messageData = {username: document.getElementById('login_username').value,
                         password: document.getElementById('login_password').value};
    fetch('/api/signup', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(result => {
        if (result == 'Invalid username') {
            const messagesContainer = document.querySelector('.login_error_message');
            messagesContainer.innerHTML = 'User name already exists, please create another one!'
        } else {
            window.location.href = result.redirectUrl;
        }
    })
    .catch(error => {
        console.error(error);
    });
}
function logout() {
    fetch(`/api/logout`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(result => {
        location.reload();
    })
    .catch(error => {
        console.error(error);
    });
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('login') == 0) {
        show_page('login');
        hide_page('login_error');
        hide_page('profile');
        hide_page('application');
    } else {
        hide_page('login');
    }
});
document.querySelector("#login_button").addEventListener('click', function() {
    login();
});
document.querySelector("#signup_button").addEventListener('click', function() {
    signup();
});
document.querySelector("#logout_button").addEventListener('click', (e) => {
    logout();
});


// profile
function updateProfile() {
    fetch('/api/profile', {
        method: 'POST',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json",
            "username": document.getElementById('profile_username').value,
            "password": document.getElementById('profile_password').value
          }
    })
    .then(response => response.json())
    .then(result => {
        if (result == 'Username already exists') {
            const messagesContainer = document.querySelector('.profile_update_error');
            messagesContainer.innerHTML = 'User name already exists, please use another one!'
        } else {
            window.location.href = result.redirectUrl;
        }
    })
    .catch(error => {
        console.error(error);
    });
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('profile') == 0) {
        hide_page('login');
        show_page('profile');
        hide_page('application');
    }
});
if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('profile') == 0) {
    document.querySelector("#profile_update_button").addEventListener('click', function() {
        updateProfile();
    });
}


// no channel no thread selected
function getChannelsList() {
    console.log('Launched get channels');
    fetch(`/api/get_channels_list`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(channels => {
        displayChannelsList(channels);
    })
    .catch(error => console.error('Error:', error));
}
function displayChannelsList(channels) {
    var channelId = null;
    if (PATH_LIST[1] == 'channel') {
        channelId = PATH_LIST[2];
    }
    const messagesContainer = document.querySelector('.channelsList');
    messagesContainer.innerHTML = '';
    if (typeof channels === 'string' || channels instanceof String) {
        console.log('wrong backend input');
        return;
    } else {
        channels.forEach(channel => {
            const channelElement = document.createElement('a');
            channelElement.setAttribute('class', 'channel');
            channelElement.setAttribute('href', `/channel/${channel.id}`);
            if (channelId == channel.id) {
                channelElement.setAttribute('style', 'color: white');
            }
            if (channel.unread > 0) {
                channelElement.innerHTML = `# <strong>${channel.name} (${channel.unread})</strong><br><br>`;
            } else {
                if (channelId == channel.id) {
                    channelElement.innerHTML = `<strong># ${channel.name}</strong><br><br>`;
                } else {
                    channelElement.innerHTML = `# ${channel.name}<br><br>`;
                }
            }
            messagesContainer.appendChild(channelElement);
        })
    }
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('') == 0) {
        //console.log(window.innerWidth);
        hide_page('channel_error');
        if (window.innerWidth < WINDOW_WIDTH_CUTOFF){
            hide_page('login');
            hide_page('profile');
            show_page('channels_column');
            expand_page('channels_column');
            hide_page('messages_column');
            hide_page('messages_none');
            hide_page('replies_column');
            getChannelsList();
        } else {
            hide_page('login');
            hide_page('profile');
            show_page('channels_column');
            hide_page('messages_column');
            show_page('messages_none');
            hide_page('replies_column');
            getChannelsList();
        }
    }
});
if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('') == 0) {
    setInterval(getChannelsList, CHANNELS_INTERVAL);
}

function addChannel() {
    const name = document.getElementById('channel_name').value;
    const messageData = {channel_name: name};
    fetch (`/api/add_channel`, {
        method: 'POST',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(result => {
        if (typeof result === 'string' || result instanceof String) {
            show_page('channel_error');
        } else {
            document.getElementById('channel_name').value = '';
        }
    })
    .catch(error => {
      console.error('Error adding channel:', error);
    });
}
document.querySelector('#add_channel').addEventListener('click', function() {
    hide_page('channel_error');
    addChannel();
})


// channel selected, no thread selected
function displayChannelName() {
    const channelId = new URL(window.location.href).pathname.split('/')[2];
    fetch(`/api/get_channel_name/${channelId}`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        },
    })
    .then(response => response.json())
    .then(name => {
        const messagesContainer = document.querySelector('.channelName');
        messagesContainer.innerHTML = `${name}`;
    })
    .catch(error => console.error('Error:', error));
}
function getMessages() {
    const channelId = new URL(window.location.href).pathname.split('/')[2];
    fetch(`/api/get_messages/${channelId}`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        },
    })
    .then(response => response.json())
    .then(messages => {
        displayMessages(messages, 'messages');
    })
    .catch(error => console.error('Error:', error));
}
function isImage(url) {
    const img = new Image();
    img.src = url;
    return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}
function displayMessages(messages, section) {
    const messagesContainer = document.querySelector(`.${section}`);
    messagesContainer.innerHTML = '';
    if (typeof messages === 'string' || messages instanceof String) {
        if (section == 'messages') {
            messagesContainer.innerHTML = 'No message in this channel yet';
        } else {
            messagesContainer.innerHTML = 'No replies to this message yet';
        }
    } else {
        messages.forEach(message => {
            const messageElement = document.createElement('message');
            messageElement.innerHTML = `
                <div class="user">${message.user_name}</div>
                <div class="body" id="textArea_${message.id}">${message.body}</div>
                <br>
                <div id="imagesArea_${message.id}_${section}"></div>
                <div id="emoji_box_${message.id}_${section}" class="emoji-picker">
                    <button id="emoji-${message.id}-1_${section}" class="emoji">&#x1F600; ${message.e1} <a id="${message.id}-1_${section}">${message.reacters1}</a></span>
                    <button id="emoji-${message.id}-2_${section}" class="emoji">&#x1F601; ${message.e2} <a id="${message.id}-2_${section}">${message.reacters2}</a></span>
                    <button id="emoji-${message.id}-3_${section}" class="emoji">&#x1F602; ${message.e3} <a id="${message.id}-3_${section}">${message.reacters3}</a></span>
                </div>
                <br>`;
            messagesContainer.appendChild(messageElement);
            
            // Add images
            const imagesContainer = document.getElementById(`imagesArea_${message.id}_${section}`);
            const urls = message.body.split(/\s+/).filter(text => text.startsWith('http'));
            urls.forEach(url => {
                isImage(url).then(urlIsImage => {
                    if (urlIsImage) {
                        const img = document.createElement('img');
                        img.src = url;
                        img.style.maxWidth = '150px';
                        img.style.margin = '10px';
                        imagesContainer.appendChild(img);
                    } else {
                        console.log('image error');
                    }
                });
            });

            // Add emoji buttons
            document.querySelector(`#emoji-${message.id}-1_${section}`).addEventListener('click', (e) => {
                postEmoji(message.id, '&#x1F600;');
            });
            document.querySelector(`#emoji-${message.id}-2_${section}`).addEventListener('click', (e) => {
                postEmoji(message.id, '&#x1F601;');
            });
            document.querySelector(`#emoji-${message.id}-3_${section}`).addEventListener('click', (e) => {
                postEmoji(message.id, '&#x1F602;');
            });
            hide_page(`${message.id}-1_${section}`);
            document.querySelector(`#emoji-${message.id}-1_${section}`).addEventListener('mouseover', (e) => {
                show_page(`${message.id}-1_${section}`);
            });
            hide_page(`${message.id}-2_${section}`);
            document.querySelector(`#emoji-${message.id}-2_${section}`).addEventListener('mouseover', (e) => {
                show_page(`${message.id}-2_${section}`);
            });
            hide_page(`${message.id}-3_${section}`);
            document.querySelector(`#emoji-${message.id}-3_${section}`).addEventListener('mouseover', (e) => {
                show_page(`${message.id}-3_${section}`);
            });

            // Add reply button
            if (section != 'reply_message') {
                const reply = document.createElement('replies');
                if (message.replies > 0) {
                    reply.innerHTML = `<span class="reply"><a href="/channel/${message.channel_id}/thread/${message.id}">Reply (${message.replies})</a></span><br><br>`;
                } else {
                    reply.innerHTML = `<span class="reply"><a href="/channel/${message.channel_id}/thread/${message.id}">Reply</a></span><br><br>`;
                }
                messageElement.appendChild(reply);
            }
        })
    }
}
window.addEventListener('load', function() {
    if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('channel') == 0) {
        //console.log(window.innerWidth);
        hide_page('channel_error');
        if (window.innerWidth < WINDOW_WIDTH_CUTOFF){
            hide_page('login');
            hide_page('profile');
            hide_page('channels_column');
            show_page('messages_column');
            expand_page('messages_column');
            hide_page('messages_none');
            hide_page('replies_column');
            getChannelsList();
            displayChannelName();
            getMessages();
        } else {
            hide_page('login');
            hide_page('profile');
            show_page('channels_column');
            show_page('messages_column');
            hide_page('messages_none');
            hide_page('replies_column');
            getChannelsList();
            displayChannelName();
            getMessages();
        }
    }
});

if ((new URL(window.location.href).pathname.split('/')[1]).localeCompare('channel') == 0) {
    setInterval(getMessages, MESSAGES_INTERVAL);
}

function postNewMessage() {
    //console.log('post msg');
    const channelId = new URL(window.location.href).pathname.split('/')[2];
    const msg = document.getElementById(`message_content`).value;
    const messageData = {channel_id: channelId, message: msg};
    
    fetch(`/api/post_message/${channelId}`, {
        method: 'POST',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(messageData)
    })
    .then(response =>  response.json())
    .then(_ => {
        document.getElementById('message_content').value = '';
    })
    .catch(error => {
      console.error('Error posting message:', error);
    });
}
document.querySelector("#post_button").addEventListener('click', function() {
    postNewMessage();
});

function postEmoji(messageId, emojiCode) {
    console.log('post reaction');
    const data = {emoji_code: emojiCode}
    fetch(`/api/post_emoji/${messageId}`, {
        method: 'POST',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .catch(error => console.error('Error:', error));
}


// thread selected
function getReplies() {
    const channelId = new URL(window.location.href).pathname.split('/')[2];
    const threadId = new URL(window.location.href).pathname.split('/')[4];
    fetch(`/api/get_message/${threadId}`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        },
    })
    .then(response => response.json())
    .then(message => {
        displayMessages(message, 'reply_message');
    })
    .catch(error => console.error('Error:', error));

    fetch(`/api/get_replies/${channelId}/${threadId}`, {
        method: 'GET',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
        },
    })
    .then(response => response.json())
    .then(replies => {
        displayMessages(replies, 'thread-messages');
    })
    .catch(error => console.error('Error:', error));
}
function displayReplies(replies) {
    const repliesContainer = document.querySelector('.thread-messages');
    repliesContainer.innerHTML = '';
    if (typeof replies === 'string' || replies instanceof String) {
        repliesContainer.innerHTML = 'No replies to this message yet';
    } else {
        replies.forEach(reply => {
            const messageElement = document.createElement('reply');
            messageElement.innerHTML = `
                <span class="user">${reply.user_name}</span>
                <span class="body">${reply.body}</span>
                <br><br>
            `;
            repliesContainer.appendChild(messageElement);
        })
    }
}
window.addEventListener('load', function() {
    if ((PATH_LIST[PATH_LIST.length-2]).localeCompare('thread') == 0) {
        hide_page('channel_error');
        //console.log(window.innerWidth);
        if (window.innerWidth < WINDOW_WIDTH_CUTOFF){
            hide_page('login');
            hide_page('profile');
            hide_page('channels_column');
            hide_page('messages_column');
            hide_page('messages_none');
            show_page('replies_column');
            expand_page('replies_column');
            getChannelsList();
            displayChannelName();
        } else {
            hide_page('login');
            hide_page('profile');
            show_page('channels_column');
            show_page('messages_column');
            hide_page('messages_none');
            show_page('replies_column');
            getChannelsList();
            displayChannelName();
        }
    }
});

if ((PATH_LIST[PATH_LIST.length-2]).localeCompare('thread') == 0) {
    setInterval(getChannelsList, CHANNELS_INTERVAL);
    setInterval(getReplies, MESSAGES_INTERVAL);
}

function postNewReply() {
    const channelId = new URL(window.location.href).pathname.split('/')[2];
    const threadId = new URL(window.location.href).pathname.split('/')[4];
    const reply = document.getElementById(`reply_content`).value;
    const replyData = {reply: reply};
    
    fetch(`/api/post_reply/${channelId}/${threadId}`, {
        method: 'POST',
        headers: {
            'x-api-key': davidzhang_api_key,
            "Content-Type": "application/json"
          },
        body: JSON.stringify(replyData)
    })
    .then(response =>  response.json())
    .then(_ => {
        document.getElementById('message_content').value = '';
    })
    .catch(error => {
      console.error('Error posting message:', error);
    });
}
document.querySelector("#reply_button").addEventListener('click', function() {
    postNewReply();
});
document.querySelector('.to_messages').addEventListener('click', (e) => {
    e.preventDefault();
    const channelId = PATH_LIST[2];
    window.location.href = `/channel/${channelId}`;
});
