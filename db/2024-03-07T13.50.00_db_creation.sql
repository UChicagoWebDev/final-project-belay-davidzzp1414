create table users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE,
    password VARCHAR(40),
    api_key VARCHAR(40)
);

create table channels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

create table messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    channel_id INTEGER,
    reply_to INTEGER,
    body TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(reply_to) REFERENCES channels(id)
);

create table users_messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    channel_id INTEGER,
    message_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(message_id) REFERENCES messages(id)
);

create table emojis (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message_id INTEGER,
    emoji varchar(10),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(message_id) REFERENCES messages(id)
);


-- initial users
insert into users (name, password, api_key) values ('Bob', 'fewjii231', 'sample_api_key_Bob');
insert into users (name, password, api_key) values ('Alice', '12enoeinef', 'sample_api_key_Alice');
insert into users (name, password, api_key) values ('Tessa', 'fjovino4', 'sample_api_key_Tessa');
insert into users (name, password, api_key) values ('u', 'p', 'testing_api_key');

-- channels
insert into channels (name) values ('general');
insert into channels (name) values ('announcements');
insert into channels (name) values ('random');
insert into channels (name) values ('troubleshooting');
insert into channels (name) values ('Chat Channel 1');
insert into channels (name) values ('Chat Channel 2');
insert into channels (name) values ('Chat Channel 3');


-- initial messages
insert into messages (user_id, channel_id, reply_to, body) values
((select id from users where name = 'Bob'),
 (select id from channels where name = 'general'),
 null, 'Hello everyone!');

insert into messages (user_id, channel_id, reply_to, body) values
((select id from users where name = 'Alice'),
 (select id from channels where name = 'general'),
 (select id from messages where body = 'Hello everyone!'),
 'Hey Bob!');

insert into messages (user_id, channel_id, reply_to, body) values
((select id from users where name = 'Tessa'),
 (select id from channels where name = 'random'),
 null, 'I found a dog that is really cute: https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_square.jpg');

insert into messages (user_id, channel_id, reply_to, body) values
((select id from users where name = 'Bob'),
 (select id from channels where name = 'announcements'),
 null, 'This looks like a link to an image, but it actuall is not. That is why there is no image displayed here. https://hips.hearstapps.com/hmg-prod/images/cute-cat-photos-1593441022.jpg?crop=0.670xw:1.00xh;0.167xw,0&resize=640:');

 insert into messages (user_id, channel_id, reply_to, body) values
((select id from users where name = 'Bob'),
 (select id from channels where name = 'announcements'),
 null, 'But if you add a * to the end of it, it becomes a valid image URL. https://hips.hearstapps.com/hmg-prod/images/cute-cat-photos-1593441022.jpg?crop=0.670xw:1.00xh;0.167xw,0&resize=640:*');
